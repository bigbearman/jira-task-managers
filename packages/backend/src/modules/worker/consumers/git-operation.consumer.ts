import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAME, QUEUE_PROCESSOR } from '@/shared/constants/queue';
import {
  TicketRepository,
  TaskActionRepository,
  GitOperationRepository,
  ActionStatus,
  GitOperationType,
  GitOperationStatus,
} from '@/database';
import { GitService } from '@/git/git.service';
import { GithubService } from '@/git/github.service';
import { ClaudeService } from '@/claude/claude.service';
import { JiraService } from '@/jira/jira.service';
import { JiraInstanceRepository } from '@/database';
import { parseAdfToText } from '@/shared/utils/jira-adf-parser';

@Processor(QUEUE_NAME.GIT_OPERATION)
export class GitOperationConsumer extends WorkerHost {
  private readonly logger = new Logger(GitOperationConsumer.name);

  constructor(
    private readonly ticketRepo: TicketRepository,
    private readonly taskActionRepo: TaskActionRepository,
    private readonly gitOperationRepo: GitOperationRepository,
    private readonly instanceRepo: JiraInstanceRepository,
    private readonly gitService: GitService,
    private readonly githubService: GithubService,
    private readonly claudeService: ClaudeService,
    private readonly jiraService: JiraService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case QUEUE_PROCESSOR.GIT_OPERATION.FULL_APPROVE_FLOW:
        return this.fullApproveFlow(job);
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  /**
   * Full approve flow:
   * 1. Create branch
   * 2. Claude: apply code changes
   * 3. Run tests
   * 4. Commit + push
   * 5. Create PR
   * 6. Add Jira comment with PR link
   */
  private async fullApproveFlow(job: Job<{ ticketId: string; taskActionId: string }>) {
    const { ticketId, taskActionId } = job.data;
    this.logger.log(`Starting full approve flow for ticket ${ticketId}`);

    await this.taskActionRepo.update(taskActionId, { status: ActionStatus.PROCESSING });

    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['project', 'project.instance'],
    });
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const action = await this.taskActionRepo.findOne({ where: { id: taskActionId } });
    if (!action) throw new Error(`TaskAction ${taskActionId} not found`);

    const projectPath = (action.inputContext?.projectPath as string) ?? process.cwd();
    const approach = (action.inputContext?.approach as string) ?? '';
    const targetBranch = (action.inputContext?.targetBranch as string) ?? 'develop';
    const branchName = this.gitService.getBranchName(ticket.jiraTicketKey);

    try {
      // Step 1: Create branch
      await job.updateProgress(10);
      const branchOp = await this.createGitOp(ticketId, taskActionId, GitOperationType.BRANCH_CREATE, branchName);
      const branchResult = await this.gitService.createBranch(ticket.jiraTicketKey, projectPath);
      if (!branchResult.success) {
        await this.failGitOp(branchOp.id, branchResult.output);
        throw new Error(`Branch creation failed: ${branchResult.output}`);
      }
      await this.completeGitOp(branchOp.id, { output: branchResult.output });

      // Step 2: Claude apply code
      await job.updateProgress(20);
      const codeOp = await this.createGitOp(ticketId, taskActionId, GitOperationType.CODE_APPLY, branchName);

      const descriptionText = ticket.description ? parseAdfToText(ticket.description) : '';
      const ticketContext = [
        `Ticket: ${ticket.jiraTicketKey}`,
        `Summary: ${ticket.summary}`,
        `Type: ${ticket.issueType ?? 'Task'}`,
        `Priority: ${ticket.priority ?? 'Medium'}`,
        `Description: ${descriptionText}`,
      ].join('\n');

      const codeResult = await this.claudeService.applyCode(approach, projectPath, ticketContext);
      if (!codeResult.success) {
        await this.failGitOp(codeOp.id, `Claude CLI exit code: ${codeResult.exitCode}`);
        throw new Error(`Code apply failed: ${codeResult.output.substring(0, 500)}`);
      }
      await this.completeGitOp(codeOp.id, { output: codeResult.output.substring(0, 2000) });

      // Step 3: Run tests
      await job.updateProgress(50);
      const testOp = await this.createGitOp(ticketId, taskActionId, GitOperationType.TEST_RUN, branchName);
      const changedFiles = await this.gitService.getChangedFiles(projectPath);

      if (changedFiles.length === 0) {
        await this.failGitOp(testOp.id, 'No files changed by Claude');
        throw new Error('No files were changed by Claude CLI');
      }

      const testResult = await this.gitService.runTests(projectPath);
      await this.gitOperationRepo.update(testOp.id, {
        status: testResult.success ? GitOperationStatus.COMPLETED : GitOperationStatus.FAILED,
        metadata: { testOutput: testResult.output.substring(0, 5000), changedFiles } as any,
        errorMessage: testResult.success ? null : 'Tests failed',
      });

      if (!testResult.success) {
        this.logger.warn(`Tests failed for ${ticket.jiraTicketKey}, proceeding anyway with warning`);
      }

      // Step 4: Commit + push
      await job.updateProgress(70);
      const commitMsg = `${ticket.jiraTicketKey}: ${ticket.summary}\n\nApproach: ${approach.substring(0, 200)}`;
      const commitOp = await this.createGitOp(ticketId, taskActionId, GitOperationType.COMMIT, branchName);

      const commitResult = await this.gitService.commitAll(commitMsg, projectPath);
      if (!commitResult.success) {
        await this.failGitOp(commitOp.id, commitResult.output);
        throw new Error(`Commit failed: ${commitResult.output}`);
      }

      const commitSha = await this.gitService.getLatestCommitSha(projectPath);
      await this.gitOperationRepo.update(commitOp.id, {
        status: GitOperationStatus.COMPLETED,
        commitSha,
      });

      const pushResult = await this.gitService.push(branchName, projectPath);
      if (!pushResult.success) {
        throw new Error(`Push failed: ${pushResult.output}`);
      }

      // Step 5: Create PR
      await job.updateProgress(85);
      const prOp = await this.createGitOp(ticketId, taskActionId, GitOperationType.PR_CREATE, branchName);

      const prBody = [
        `## ${ticket.jiraTicketKey}: ${ticket.summary}`,
        '',
        '### Approach',
        approach,
        '',
        '### Changed Files',
        ...changedFiles.map((f) => `- \`${f}\``),
        '',
        `Tests: ${testResult.success ? 'PASSED' : 'FAILED (see CI)'}`,
        '',
        '---',
        '*Generated by Multi Jira Task Manager (Claude CLI)*',
      ].join('\n');

      const prResult = await this.githubService.createPullRequest({
        title: `${ticket.jiraTicketKey}: ${ticket.summary}`,
        body: prBody,
        branch: branchName,
        baseBranch: targetBranch,
        projectPath,
      });

      if (!prResult.success) {
        await this.failGitOp(prOp.id, prResult.output);
        throw new Error(`PR creation failed: ${prResult.output}`);
      }

      await this.gitOperationRepo.update(prOp.id, {
        status: GitOperationStatus.COMPLETED,
        prNumber: prResult.prNumber,
        prUrl: prResult.prUrl,
      });

      // Step 6: Add Jira comment
      await job.updateProgress(95);
      if (ticket.project?.instance) {
        try {
          const instance = ticket.project.instance;
          await this.jiraService.addComment(
            { baseUrl: instance.baseUrl, email: instance.email, apiToken: instance.apiToken },
            ticket.jiraTicketKey,
            `Pull Request created: ${prResult.prUrl}\n\nBranch: ${branchName}\nChanged files: ${changedFiles.length}\nTests: ${testResult.success ? 'Passed' : 'Failed'}`,
          );
        } catch (error: any) {
          this.logger.warn(`Failed to add Jira comment: ${error.message}`);
        }
      }

      // Mark action as completed
      await this.taskActionRepo.update(taskActionId, {
        status: ActionStatus.COMPLETED,
        outputResult: {
          branchName,
          prNumber: prResult.prNumber,
          prUrl: prResult.prUrl,
          commitSha,
          changedFiles,
          testsPassed: testResult.success,
        } as any,
      });

      await job.updateProgress(100);
      this.logger.log(`Full approve flow completed for ${ticket.jiraTicketKey}: ${prResult.prUrl}`);

      return { prUrl: prResult.prUrl, branchName, commitSha };
    } catch (error: any) {
      this.logger.error(`Full approve flow failed for ${ticket.jiraTicketKey}: ${error.message}`);

      await this.taskActionRepo.update(taskActionId, {
        status: ActionStatus.FAILED,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  private async createGitOp(
    ticketId: string,
    taskActionId: string,
    type: GitOperationType,
    branchName: string,
  ) {
    const op = this.gitOperationRepo.create({
      ticketId,
      taskActionId,
      operationType: type,
      branchName,
      status: GitOperationStatus.PROCESSING,
    });
    return this.gitOperationRepo.save(op);
  }

  private async completeGitOp(id: string, metadata?: Record<string, any>) {
    await this.gitOperationRepo.update(id, {
      status: GitOperationStatus.COMPLETED,
      metadata: metadata as any ?? null,
    });
  }

  private async failGitOp(id: string, errorMessage: string) {
    await this.gitOperationRepo.update(id, {
      status: GitOperationStatus.FAILED,
      errorMessage,
    });
  }
}

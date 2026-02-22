import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAME, QUEUE_PROCESSOR } from '@/shared/constants/queue';
import {
  TicketRepository,
  TaskActionRepository,
  AiAnalysisRepository,
  ActionStatus,
  AnalysisType,
  AnalysisStatus,
} from '@/database';
import { ClaudeService } from '@/claude/claude.service';
import { parseAdfToText } from '@/shared/utils/jira-adf-parser';

@Processor(QUEUE_NAME.AI_ANALYSIS)
export class AiAnalysisConsumer extends WorkerHost {
  private readonly logger = new Logger(AiAnalysisConsumer.name);

  constructor(
    private readonly ticketRepo: TicketRepository,
    private readonly taskActionRepo: TaskActionRepository,
    private readonly aiAnalysisRepo: AiAnalysisRepository,
    private readonly claudeService: ClaudeService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case QUEUE_PROCESSOR.AI_ANALYSIS.ANALYZE_TICKET:
        return this.analyzeTicket(job);
      case QUEUE_PROCESSOR.AI_ANALYSIS.APPLY_CODE:
        return this.applyCode(job);
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  private async analyzeTicket(job: Job<{ ticketId: string; taskActionId: string }>) {
    const { ticketId, taskActionId } = job.data;
    this.logger.log(`Analyzing ticket ${ticketId} (action: ${taskActionId})`);

    // Mark action as processing
    await this.taskActionRepo.update(taskActionId, { status: ActionStatus.PROCESSING });

    // Create AI analysis record
    const analysis = this.aiAnalysisRepo.create({
      ticketId,
      taskActionId,
      analysisType: AnalysisType.SUMMARY,
      status: AnalysisStatus.PROCESSING,
    });
    const savedAnalysis = await this.aiAnalysisRepo.save(analysis);

    try {
      const ticket = await this.ticketRepo.findOne({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new Error(`Ticket ${ticketId} not found`);
      }

      // Get custom prompt from action input context
      const action = await this.taskActionRepo.findOne({ where: { id: taskActionId } });
      const customPrompt = action?.inputContext?.customPrompt as string | undefined;

      // Parse ADF description to text
      const descriptionText = ticket.description
        ? parseAdfToText(ticket.description)
        : null;

      // Execute Claude analysis
      const { result, raw } = await this.claudeService.analyzeTicket(
        {
          key: ticket.jiraTicketKey,
          summary: ticket.summary,
          description: descriptionText,
          issueType: ticket.issueType,
          priority: ticket.priority,
          labels: ticket.labels,
          components: ticket.components,
        },
        customPrompt,
      );

      // Update analysis record
      await this.aiAnalysisRepo.update(savedAnalysis.id, {
        prompt: `Analyze ticket ${ticket.jiraTicketKey}: ${ticket.summary}`,
        response: raw.output,
        model: raw.model,
        durationMs: raw.durationMs,
        status: AnalysisStatus.COMPLETED,
      });

      // Update action with analysis result
      await this.taskActionRepo.update(taskActionId, {
        status: ActionStatus.COMPLETED,
        outputResult: {
          summary: result.summary,
          solution: result.solution,
          approach: result.approach,
          estimatedComplexity: result.estimatedComplexity,
          suggestedFiles: result.suggestedFiles,
          risks: result.risks,
        } as any,
      });

      this.logger.log(`Analysis completed for ticket ${ticket.jiraTicketKey}`);
      return result;
    } catch (error: any) {
      this.logger.error(`Analysis failed for ticket ${ticketId}: ${error.message}`);

      await this.aiAnalysisRepo.update(savedAnalysis.id, {
        status: AnalysisStatus.FAILED,
        errorMessage: error.message,
      });

      await this.taskActionRepo.update(taskActionId, {
        status: ActionStatus.FAILED,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  private async applyCode(job: Job<{
    ticketId: string;
    taskActionId: string;
    approach: string;
    projectPath: string;
  }>) {
    const { ticketId, taskActionId, approach, projectPath } = job.data;
    this.logger.log(`Applying code for ticket ${ticketId} (action: ${taskActionId})`);

    await this.taskActionRepo.update(taskActionId, { status: ActionStatus.PROCESSING });

    try {
      const ticket = await this.ticketRepo.findOne({
        where: { id: ticketId },
      });

      if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

      const descriptionText = ticket.description
        ? parseAdfToText(ticket.description)
        : '';

      const ticketContext = [
        `Ticket: ${ticket.jiraTicketKey}`,
        `Summary: ${ticket.summary}`,
        `Type: ${ticket.issueType ?? 'Task'}`,
        `Description: ${descriptionText}`,
      ].join('\n');

      // Create analysis record for code apply
      const analysis = this.aiAnalysisRepo.create({
        ticketId,
        taskActionId,
        analysisType: AnalysisType.SOLUTION,
        status: AnalysisStatus.PROCESSING,
        prompt: `Apply code: ${approach.substring(0, 500)}`,
      });
      const savedAnalysis = await this.aiAnalysisRepo.save(analysis);

      const result = await this.claudeService.applyCode(approach, projectPath, ticketContext);

      await this.aiAnalysisRepo.update(savedAnalysis.id, {
        response: result.output,
        model: result.model,
        durationMs: result.durationMs,
        status: result.success ? AnalysisStatus.COMPLETED : AnalysisStatus.FAILED,
        errorMessage: result.success ? null : `Exit code: ${result.exitCode}`,
      });

      if (!result.success) {
        throw new Error(`Claude CLI failed with exit code ${result.exitCode}`);
      }

      this.logger.log(`Code applied for ticket ${ticket.jiraTicketKey}`);
      return result;
    } catch (error: any) {
      this.logger.error(`Code apply failed for ticket ${ticketId}: ${error.message}`);

      await this.taskActionRepo.update(taskActionId, {
        status: ActionStatus.FAILED,
        errorMessage: error.message,
      });

      throw error;
    }
  }
}

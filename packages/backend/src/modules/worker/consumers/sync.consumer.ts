import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAME, QUEUE_PROCESSOR } from '@/shared/constants/queue';
import { JiraService } from '@/jira/jira.service';
import { JiraAgileService } from '@/jira/jira-agile.service';
import { JiraCredentials, JiraIssue } from '@/jira/jira.types';
import { parseAdfToText } from '@/shared/utils/jira-adf-parser';
import {
  JiraInstanceRepository,
  ProjectRepository,
  SprintRepository,
  TicketRepository,
  VersionRepository,
  SyncLogRepository,
} from '@/database';
import { SyncStatus } from '@/database';
import { QueueService } from '@/queue/queue.service';

@Processor(QUEUE_NAME.JIRA_SYNC, { concurrency: 3 })
export class SyncConsumer extends WorkerHost {
  private readonly logger = new Logger(SyncConsumer.name);

  constructor(
    private readonly jiraService: JiraService,
    private readonly jiraAgileService: JiraAgileService,
    private readonly instanceRepo: JiraInstanceRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly sprintRepo: SprintRepository,
    private readonly ticketRepo: TicketRepository,
    private readonly versionRepo: VersionRepository,
    private readonly syncLogRepo: SyncLogRepository,
    private readonly queueService: QueueService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case QUEUE_PROCESSOR.JIRA_SYNC.SYNC_ALL:
        return this.syncAll(job);
      case QUEUE_PROCESSOR.JIRA_SYNC.SYNC_PROJECTS:
        return this.syncProjects(job);
      case QUEUE_PROCESSOR.JIRA_SYNC.SYNC_SPRINTS:
        return this.syncSprints(job);
      case QUEUE_PROCESSOR.JIRA_SYNC.SYNC_VERSIONS:
        return this.syncVersions(job);
      case QUEUE_PROCESSOR.JIRA_SYNC.SYNC_TICKETS:
        return this.syncTickets(job);
      case QUEUE_PROCESSOR.JIRA_SYNC.SYNC_SPRINT_TICKETS:
        return this.syncSprintTickets(job);
      case QUEUE_PROCESSOR.JIRA_SYNC.SYNC_TICKET_COMMENTS:
        return this.syncTicketComments(job);
      case QUEUE_PROCESSOR.JIRA_SYNC.SYNC_TICKET_WORKLOGS:
        return this.syncTicketWorklogs(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async getCredentials(instanceId: string): Promise<JiraCredentials> {
    const instance = await this.instanceRepo.findOne({ where: { id: instanceId } });
    if (!instance) throw new Error(`Instance ${instanceId} not found`);
    return { baseUrl: instance.baseUrl, email: instance.email, apiToken: instance.apiToken };
  }

  private async syncAll(job: Job): Promise<void> {
    const { instanceId, triggeredBy } = job.data;
    this.logger.log(`[SYNC_ALL] Starting for instance ${instanceId}`);

    const syncLog = await this.syncLogRepo.createLog({
      syncType: 'full',
      entityType: 'all',
      instanceId,
      triggeredBy,
    });
    await this.syncLogRepo.markRunning(syncLog.id);

    try {
      // 1. Sync projects
      await this.queueService.addSyncProjectsJob(instanceId);

      // 2. Wait briefly then sync sprints + versions + tickets per project
      const instance = await this.instanceRepo.findOne({ where: { id: instanceId }, relations: ['projects'] });
      if (instance?.projects) {
        for (const project of instance.projects) {
          await this.queueService.addSyncTicketsJob(instanceId, project.jiraProjectKey, project.jiraProjectId);
          await this.queueService.addSyncVersionsJob(instanceId, project.jiraProjectKey, project.jiraProjectId);
        }
      }

      // Sync boards and sprints
      const creds = await this.getCredentials(instanceId);
      const boards = await this.jiraAgileService.getBoards(creds);
      for (const board of boards) {
        const projectId = board.location?.projectId?.toString();
        if (projectId) {
          await this.queueService.addSyncSprintsJob(instanceId, board.id, projectId);
        }
      }

      await this.syncLogRepo.markCompleted(syncLog.id, { processed: 1, created: 0, updated: 0, failed: 0 });
      await this.instanceRepo.update(instanceId, { lastSyncedAt: new Date() });
    } catch (error: any) {
      await this.syncLogRepo.markFailed(syncLog.id, error.message);
      throw error;
    }
  }

  private async syncProjects(job: Job): Promise<void> {
    const { instanceId } = job.data;
    const creds = await this.getCredentials(instanceId);
    this.logger.log(`[SYNC_PROJECTS] Instance: ${instanceId}`);

    const projects = await this.jiraService.getProjects(creds);
    let created = 0, updated = 0;

    for (const p of projects) {
      const existing = await this.projectRepo.findOne({
        where: { jiraProjectId: p.id, instanceId },
      });

      if (existing) {
        await this.projectRepo.update(existing.id, {
          name: p.name,
          description: p.description || null,
          projectType: p.projectTypeKey,
          leadAccountId: p.lead?.accountId || null,
          leadDisplayName: p.lead?.displayName || null,
          avatarUrl: p.avatarUrls?.['48x48'] || null,
        });
        updated++;
      } else {
        await this.projectRepo.save(this.projectRepo.create({
          instanceId,
          jiraProjectId: p.id,
          jiraProjectKey: p.key,
          name: p.name,
          description: p.description || null,
          projectType: p.projectTypeKey,
          leadAccountId: p.lead?.accountId || null,
          leadDisplayName: p.lead?.displayName || null,
          avatarUrl: p.avatarUrls?.['48x48'] || null,
        }));
        created++;
      }
    }

    this.logger.log(`[SYNC_PROJECTS] Done: ${created} created, ${updated} updated`);
  }

  private async syncSprints(job: Job): Promise<void> {
    const { instanceId, boardId, projectId } = job.data;
    const creds = await this.getCredentials(instanceId);
    this.logger.log(`[SYNC_SPRINTS] Board: ${boardId}`);

    const sprints = await this.jiraAgileService.getAllSprintsForBoard(creds, boardId);
    let created = 0, updated = 0;

    for (const s of sprints) {
      const existing = await this.sprintRepo.findByJiraSprintId(s.id);
      const sprintData = {
        jiraProjectId: projectId,
        name: s.name,
        state: s.state,
        startDate: s.startDate ? new Date(s.startDate) : null,
        endDate: s.endDate ? new Date(s.endDate) : null,
        completeDate: s.completeDate ? new Date(s.completeDate) : null,
        goal: s.goal || null,
        boardId: s.originBoardId || boardId,
      };

      if (existing) {
        await this.sprintRepo.update(existing.id, sprintData);
        updated++;
      } else {
        await this.sprintRepo.save(this.sprintRepo.create({
          jiraSprintId: s.id,
          ...sprintData,
        }));
        created++;
      }
    }

    this.logger.log(`[SYNC_SPRINTS] Done: ${created} created, ${updated} updated`);
  }

  private async syncVersions(job: Job): Promise<void> {
    const { instanceId, projectKey, projectId } = job.data;
    const creds = await this.getCredentials(instanceId);
    this.logger.log(`[SYNC_VERSIONS] Project: ${projectKey}`);

    const versions = await this.jiraService.getProjectVersions(creds, projectKey);
    let created = 0, updated = 0;

    for (const v of versions) {
      const existing = await this.versionRepo.findByJiraVersionId(v.id);
      const versionData = {
        jiraProjectId: projectId,
        name: v.name,
        description: v.description || null,
        isReleased: v.released || false,
        isArchived: v.archived || false,
        releaseDate: v.releaseDate ? new Date(v.releaseDate) : null,
        startDate: v.startDate ? new Date(v.startDate) : null,
      };

      if (existing) {
        await this.versionRepo.update(existing.id, versionData);
        updated++;
      } else {
        await this.versionRepo.save(this.versionRepo.create({
          jiraVersionId: v.id,
          ...versionData,
        }));
        created++;
      }
    }

    this.logger.log(`[SYNC_VERSIONS] Done: ${created} created, ${updated} updated`);
  }

  private async syncTickets(job: Job): Promise<void> {
    const { instanceId, projectKey, projectId, syncLogId } = job.data;
    const creds = await this.getCredentials(instanceId);
    this.logger.log(`[SYNC_TICKETS] Project: ${projectKey}`);

    if (syncLogId) await this.syncLogRepo.markRunning(syncLogId);

    let created = 0, updated = 0, failed = 0;
    const jql = `project = ${projectKey} ORDER BY updated DESC`;

    try {
      const issues = await this.jiraService.fetchAllPages<JiraIssue>(
        (startAt, maxResults) => this.jiraService.searchIssues(creds, jql, startAt, maxResults),
      );

      for (const issue of issues) {
        try {
          const result = await this.upsertTicket(issue, projectId);
          if (result === 'created') created++;
          else updated++;
        } catch (e: any) {
          this.logger.error(`Failed to upsert ticket ${issue.key}: ${e.message}`);
          failed++;
        }
      }

      if (syncLogId) {
        await this.syncLogRepo.markCompleted(syncLogId, {
          processed: issues.length, created, updated, failed,
        });
      }
    } catch (error: any) {
      if (syncLogId) await this.syncLogRepo.markFailed(syncLogId, error.message);
      throw error;
    }

    this.logger.log(`[SYNC_TICKETS] Done: ${created} created, ${updated} updated, ${failed} failed`);
  }

  private async syncSprintTickets(job: Job): Promise<void> {
    const { instanceId, sprintId, sprintDbId } = job.data;
    const creds = await this.getCredentials(instanceId);
    this.logger.log(`[SYNC_SPRINT_TICKETS] Sprint: ${sprintId}`);

    const issues = await this.jiraAgileService.getAllSprintIssues(creds, sprintId);
    const sprint = await this.sprintRepo.findOne({
      where: { id: sprintDbId },
      relations: ['tickets'],
    });

    if (!sprint) return;

    const ticketIds: string[] = [];
    for (const issue of issues) {
      const ticket = await this.ticketRepo.findOne({
        where: { jiraTicketId: issue.id },
      });
      if (ticket) ticketIds.push(ticket.id);
    }

    if (ticketIds.length > 0) {
      const tickets = await this.ticketRepo.findByIds(ticketIds);
      sprint.tickets = tickets;
      await this.sprintRepo.save(sprint);
    }

    this.logger.log(`[SYNC_SPRINT_TICKETS] Linked ${ticketIds.length} tickets to sprint`);
  }

  private async syncTicketComments(job: Job): Promise<void> {
    const { instanceId, ticketKey, ticketDbId } = job.data;
    const creds = await this.getCredentials(instanceId);

    const comments = await this.jiraService.getIssueComments(creds, ticketKey);
    const { Comment } = await import('@/database');
    const commentRepo = this.ticketRepo.manager.getRepository(Comment);

    for (const c of comments) {
      await commentRepo.upsert(
        {
          jiraCommentId: c.id,
          ticketId: ticketDbId,
          authorAccountId: c.author?.accountId || null,
          authorDisplayName: c.author?.displayName || null,
          body: parseAdfToText(c.body),
          renderedBody: c.renderedBody || null,
          isPublic: c.jsdPublic !== false,
          jiraCreatedAt: c.created ? new Date(c.created) : null,
          jiraUpdatedAt: c.updated ? new Date(c.updated) : null,
        },
        ['jiraCommentId'],
      );
    }
  }

  private async syncTicketWorklogs(job: Job): Promise<void> {
    const { instanceId, ticketKey, ticketDbId } = job.data;
    const creds = await this.getCredentials(instanceId);

    const worklogs = await this.jiraService.getIssueWorklogs(creds, ticketKey);
    const { Worklog } = await import('@/database');
    const worklogRepo = this.ticketRepo.manager.getRepository(Worklog);

    for (const w of worklogs) {
      await worklogRepo.upsert(
        {
          jiraWorklogId: w.id,
          ticketId: ticketDbId,
          authorAccountId: w.author?.accountId || null,
          authorDisplayName: w.author?.displayName || null,
          timeSpent: w.timeSpent || null,
          timeSpentSeconds: w.timeSpentSeconds || 0,
          comment: parseAdfToText(w.comment),
          startedAt: w.started ? new Date(w.started) : null,
          jiraCreatedAt: w.created ? new Date(w.created) : null,
          jiraUpdatedAt: w.updated ? new Date(w.updated) : null,
        },
        ['jiraWorklogId'],
      );
    }
  }

  private async upsertTicket(issue: JiraIssue, projectId: string): Promise<'created' | 'updated'> {
    const fields = issue.fields;
    const ticketData = {
      jiraProjectId: projectId,
      summary: fields.summary,
      description: parseAdfToText(fields.description),
      issueType: fields.issuetype?.name || null,
      status: fields.status?.name || null,
      priority: fields.priority?.name || null,
      assigneeAccountId: fields.assignee?.accountId || null,
      assigneeDisplayName: fields.assignee?.displayName || null,
      reporterAccountId: fields.reporter?.accountId || null,
      reporterDisplayName: fields.reporter?.displayName || null,
      creatorAccountId: fields.creator?.accountId || null,
      creatorDisplayName: fields.creator?.displayName || null,
      storyPoints: fields.customfield_10016 || null,
      originalEstimateSeconds: fields.timeoriginalestimate || null,
      timeSpentSeconds: fields.timespent || null,
      remainingEstimateSeconds: fields.timeestimate || null,
      dueDate: fields.duedate ? new Date(fields.duedate) : null,
      resolution: fields.resolution?.name || null,
      resolutionDate: fields.resolutiondate ? new Date(fields.resolutiondate) : null,
      labels: fields.labels || null,
      components: fields.components?.map((c) => c.name) || null,
      parentKey: fields.parent?.key || null,
      jiraCreatedAt: fields.created ? new Date(fields.created) : null,
      jiraUpdatedAt: fields.updated ? new Date(fields.updated) : null,
    };

    const existing = await this.ticketRepo.findOne({ where: { jiraTicketId: issue.id } });
    if (existing) {
      await this.ticketRepo.update(existing.id, ticketData);
      return 'updated';
    } else {
      await this.ticketRepo.save(this.ticketRepo.create({
        jiraTicketId: issue.id,
        jiraTicketKey: issue.key,
        ...ticketData,
      }));
      return 'created';
    }
  }
}

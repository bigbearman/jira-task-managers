import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Job } from 'bullmq';
import { QUEUE_NAME, QUEUE_PROCESSOR } from '@/shared/constants/queue';
import { JiraService } from '@/jira/jira.service';
import { JiraAgileService } from '@/jira/jira-agile.service';
import { JiraCredentials, JiraIssue, JiraVersion } from '@/jira/jira.types';
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
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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

      // 2. Sync sprints + versions + tickets per project
      const instance = await this.instanceRepo.findOne({ where: { id: instanceId }, relations: ['projects'] });
      let jobsQueued = 0;

      // Capture lastSyncedAt BEFORE updating it, so ticket sync jobs use the correct value
      const lastSyncedAt = instance?.lastSyncedAt ?? null;

      if (instance?.projects) {
        for (const project of instance.projects) {
          // Create individual sync log for each project's ticket sync
          const ticketSyncLog = await this.syncLogRepo.createLog({
            syncType: `tickets:${project.jiraProjectKey}`,
            entityType: 'ticket',
            instanceId,
            triggeredBy,
          });
          await this.queueService.addSyncTicketsJob(instanceId, project.jiraProjectKey, project.jiraProjectId, ticketSyncLog.id, lastSyncedAt);
          await this.queueService.addSyncVersionsJob(instanceId, project.jiraProjectKey, project.jiraProjectId);
          jobsQueued++;
        }
      }

      // Sync boards and sprints
      const creds = await this.getCredentials(instanceId);
      try {
        const boards = await this.jiraAgileService.getBoards(creds);
        this.logger.log(`[SYNC_ALL] Found ${boards.length} boards`);
        for (const board of boards) {
          const projectId = board.location?.projectId?.toString();
          this.logger.log(`[SYNC_ALL] Board ${board.id} (${board.name}), projectId=${projectId}`);
          if (projectId) {
            await this.queueService.addSyncSprintsJob(instanceId, board.id, projectId);
            jobsQueued++;
          }
        }
      } catch (boardError: any) {
        this.logger.warn(`[SYNC_ALL] Board sync failed (non-fatal): ${boardError.message}`);
      }

      await this.syncLogRepo.markCompleted(syncLog.id, { processed: jobsQueued, created: 0, updated: 0, failed: 0 });
      await this.instanceRepo.update(instanceId, { lastSyncedAt: new Date() });

      // Invalidate all cached data after sync
      await this.cacheManager.clear();
      this.logger.log(`[SYNC_ALL] Cache invalidated after successful sync, ${jobsQueued} sub-jobs queued`);
    } catch (error: any) {
      await this.syncLogRepo.markFailed(syncLog.id, error.message);
      throw error;
    }
  }

  private async syncProjects(job: Job): Promise<void> {
    const { instanceId } = job.data;
    const creds = await this.getCredentials(instanceId);
    this.logger.log(`[SYNC_PROJECTS] Instance: ${instanceId}`);

    const instance = await this.instanceRepo.findOne({ where: { id: instanceId } });
    let projects = await this.jiraService.getProjects(creds);

    // Filter by projectKeys if configured
    if (instance?.projectKeys && instance.projectKeys.length > 0) {
      const allowedKeys = new Set(instance.projectKeys.map(k => k.toUpperCase()));
      projects = projects.filter(p => allowedKeys.has(p.key.toUpperCase()));
      this.logger.log(`[SYNC_PROJECTS] Filtered to ${projects.length} projects by keys: ${instance.projectKeys.join(', ')}`);
    }

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

      let sprintDbId: string;
      if (existing) {
        await this.sprintRepo.update(existing.id, sprintData);
        sprintDbId = existing.id;
        updated++;
      } else {
        const saved = await this.sprintRepo.save(this.sprintRepo.create({
          jiraSprintId: s.id,
          ...sprintData,
        }));
        sprintDbId = saved.id;
        created++;
      }

      // Queue sprint-ticket linking for active/closed sprints
      if (s.state === 'active' || s.state === 'closed') {
        await this.queueService.addSyncSprintTicketsJob(instanceId, s.id, sprintDbId);
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

  private buildSyncJql(
    projectKey: string,
    assignees: string[] | null,
    lastSyncedAt: Date | null,
  ): string {
    const conditions: string[] = [`project = ${projectKey}`];

    if (!lastSyncedAt) {
      // FIRST SYNC: use statusCategory instead of hardcoded status names
      // Jira has only 3 fixed categories: "To Do", "In Progress", "Done"
      // This works regardless of custom workflow status names
      conditions.push(`statusCategory IN ("To Do", "In Progress")`);

      // Filter by assignees on first sync only
      if (assignees && assignees.length > 0) {
        const assigneeList = assignees.map(a => `"${a}"`).join(',');
        conditions.push(`assignee IN (${assigneeList})`);
      }
    } else {
      // SUBSEQUENT SYNC: fetch tickets updated since last sync (all statuses, all assignees)
      const jiraDate = lastSyncedAt.toISOString().replace('T', ' ').slice(0, 16);
      conditions.push(`updated >= "${jiraDate}"`);
    }

    return conditions.join(' AND ') + ' ORDER BY updated DESC';
  }

  private async syncTickets(job: Job): Promise<void> {
    const { instanceId, projectKey, projectId, syncLogId, lastSyncedAt: lastSyncedAtStr } = job.data;
    const creds = await this.getCredentials(instanceId);
    this.logger.log(`[SYNC_TICKETS] Project: ${projectKey}`);

    if (syncLogId) await this.syncLogRepo.markRunning(syncLogId);

    let created = 0, updated = 0, failed = 0;

    // Use lastSyncedAt from job data (snapshot at queue time) to avoid race condition
    // Fall back to querying instance if not provided (backward compatibility)
    const instance = await this.instanceRepo.findOne({ where: { id: instanceId } });
    const lastSyncedAt = lastSyncedAtStr !== undefined
      ? (lastSyncedAtStr ? new Date(lastSyncedAtStr) : null)
      : (instance?.lastSyncedAt ?? null);
    const jql = this.buildSyncJql(projectKey, instance?.assignees ?? null, lastSyncedAt);
    this.logger.log(`[SYNC_TICKETS] JQL: ${jql}`);

    try {
      const result = await this.jiraService.searchIssues(creds, jql);
      const issues = result.issues;

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

    let ticketId: string;
    let result: 'created' | 'updated';

    const existing = await this.ticketRepo.findOne({ where: { jiraTicketId: issue.id } });
    if (existing) {
      await this.ticketRepo.update(existing.id, ticketData);
      ticketId = existing.id;
      result = 'updated';
    } else {
      const saved = await this.ticketRepo.save(this.ticketRepo.create({
        jiraTicketId: issue.id,
        jiraTicketKey: issue.key,
        ...ticketData,
      }));
      ticketId = saved.id;
      result = 'created';
    }

    // Link ticket to fixVersions
    await this.linkTicketToVersions(ticketId, fields.fixVersions);

    return result;
  }

  private async linkTicketToVersions(ticketId: string, fixVersions?: JiraVersion[]): Promise<void> {
    if (!fixVersions || fixVersions.length === 0) return;

    // Clear existing version links for this ticket
    await this.ticketRepo.manager
      .createQueryBuilder()
      .delete()
      .from('jira_ticket_version')
      .where('ticket_id = :ticketId', { ticketId })
      .execute();

    // Insert new links
    for (const fv of fixVersions) {
      const version = await this.versionRepo.findByJiraVersionId(fv.id);
      if (version) {
        await this.ticketRepo.manager
          .createQueryBuilder()
          .insert()
          .into('jira_ticket_version')
          .values({ ticket_id: ticketId, version_id: version.id })
          .orIgnore()
          .execute();
      }
    }
  }
}

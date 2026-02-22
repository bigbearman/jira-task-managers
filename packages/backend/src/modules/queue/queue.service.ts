import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAME, QUEUE_PROCESSOR } from '@/shared/constants/queue';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAME.JIRA_SYNC) private readonly syncQueue: Queue,
    @InjectQueue(QUEUE_NAME.AI_ANALYSIS) private readonly aiQueue: Queue,
    @InjectQueue(QUEUE_NAME.GIT_OPERATION) private readonly gitQueue: Queue,
    @InjectQueue(QUEUE_NAME.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {}

  // ============================================
  // Sync Jobs
  // ============================================

  async addSyncAllJob(instanceId: string, triggeredBy?: string) {
    return this.syncQueue.add(
      QUEUE_PROCESSOR.JIRA_SYNC.SYNC_ALL,
      { instanceId, triggeredBy },
      { removeOnComplete: 20, removeOnFail: 50 },
    );
  }

  async addSyncProjectsJob(instanceId: string) {
    return this.syncQueue.add(
      QUEUE_PROCESSOR.JIRA_SYNC.SYNC_PROJECTS,
      { instanceId },
      { removeOnComplete: 20, removeOnFail: 50 },
    );
  }

  async addSyncSprintsJob(instanceId: string, boardId: number, projectId: string, syncLogId?: string) {
    return this.syncQueue.add(
      QUEUE_PROCESSOR.JIRA_SYNC.SYNC_SPRINTS,
      { instanceId, boardId, projectId, syncLogId },
      { removeOnComplete: 20, removeOnFail: 50 },
    );
  }

  async addSyncVersionsJob(instanceId: string, projectKey: string, projectId: string) {
    return this.syncQueue.add(
      QUEUE_PROCESSOR.JIRA_SYNC.SYNC_VERSIONS,
      { instanceId, projectKey, projectId },
      { removeOnComplete: 20, removeOnFail: 50 },
    );
  }

  async addSyncTicketsJob(instanceId: string, projectKey: string, projectId: string, syncLogId?: string) {
    return this.syncQueue.add(
      QUEUE_PROCESSOR.JIRA_SYNC.SYNC_TICKETS,
      { instanceId, projectKey, projectId, syncLogId },
      { removeOnComplete: 20, removeOnFail: 50, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  }

  async addSyncSprintTicketsJob(instanceId: string, sprintId: number, sprintDbId: string) {
    return this.syncQueue.add(
      QUEUE_PROCESSOR.JIRA_SYNC.SYNC_SPRINT_TICKETS,
      { instanceId, sprintId, sprintDbId },
      { removeOnComplete: 20, removeOnFail: 50 },
    );
  }

  async addSyncTicketCommentsJob(instanceId: string, ticketKey: string, ticketDbId: string) {
    return this.syncQueue.add(
      QUEUE_PROCESSOR.JIRA_SYNC.SYNC_TICKET_COMMENTS,
      { instanceId, ticketKey, ticketDbId },
      { removeOnComplete: 20, removeOnFail: 50 },
    );
  }

  async addSyncTicketWorklogsJob(instanceId: string, ticketKey: string, ticketDbId: string) {
    return this.syncQueue.add(
      QUEUE_PROCESSOR.JIRA_SYNC.SYNC_TICKET_WORKLOGS,
      { instanceId, ticketKey, ticketDbId },
      { removeOnComplete: 20, removeOnFail: 50 },
    );
  }

  // ============================================
  // AI Analysis Jobs
  // ============================================

  async addAnalyzeTicketJob(ticketId: string, taskActionId: string) {
    return this.aiQueue.add(
      QUEUE_PROCESSOR.AI_ANALYSIS.ANALYZE_TICKET,
      { ticketId, taskActionId },
      { removeOnComplete: 10, removeOnFail: 50, attempts: 2, backoff: { type: 'fixed', delay: 10000 } },
    );
  }

  async addApplyCodeJob(ticketId: string, taskActionId: string, approach: string, projectPath: string) {
    return this.aiQueue.add(
      QUEUE_PROCESSOR.AI_ANALYSIS.APPLY_CODE,
      { ticketId, taskActionId, approach, projectPath },
      { removeOnComplete: 10, removeOnFail: 50, attempts: 1 },
    );
  }

  // ============================================
  // Git Operation Jobs
  // ============================================

  async addFullApproveFlowJob(ticketId: string, taskActionId: string) {
    return this.gitQueue.add(
      QUEUE_PROCESSOR.GIT_OPERATION.FULL_APPROVE_FLOW,
      { ticketId, taskActionId },
      { removeOnComplete: 10, removeOnFail: 50, attempts: 1 },
    );
  }

  // ============================================
  // Notification Jobs
  // ============================================

  async addTelegramNotification(chatId: string, message: string, referenceType?: string, referenceId?: string) {
    return this.notificationQueue.add(
      QUEUE_PROCESSOR.NOTIFICATION.SEND_TELEGRAM,
      { chatId, message, referenceType, referenceId },
      { removeOnComplete: 50, removeOnFail: 100 },
    );
  }
}

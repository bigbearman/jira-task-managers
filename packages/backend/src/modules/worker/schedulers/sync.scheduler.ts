import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JiraInstanceRepository } from '@/database';
import { QueueService } from '@/queue/queue.service';

@Injectable()
export class SyncScheduler {
  private readonly logger = new Logger(SyncScheduler.name);

  constructor(
    private readonly instanceRepo: JiraInstanceRepository,
    private readonly queueService: QueueService,
  ) {}

  @Cron('*/15 * * * *')
  async syncActiveSprintTickets(): Promise<void> {
    this.logger.log('[CRON] Syncing active sprint tickets...');
    const instances = await this.instanceRepo.findSyncEnabled();
    for (const instance of instances) {
      await this.queueService.addSyncAllJob(instance.id, 'cron:active-sprint');
    }
  }

  @Cron('0 */2 * * *')
  async syncAllProjects(): Promise<void> {
    this.logger.log('[CRON] Full project sync...');
    const instances = await this.instanceRepo.findSyncEnabled();
    for (const instance of instances) {
      await this.queueService.addSyncProjectsJob(instance.id);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldSyncLogs(): Promise<void> {
    this.logger.log('[CRON] Cleaning up old sync logs...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { SyncLog } = await import('@/database');
    const repo = this.instanceRepo.manager.getRepository(SyncLog);
    const result = await repo
      .createQueryBuilder()
      .delete()
      .where('created_at < :date', { date: thirtyDaysAgo })
      .execute();

    this.logger.log(`[CRON] Deleted ${result.affected} old sync logs`);
  }
}

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAME } from '@/shared/constants/queue';
import { DatabaseModule } from '@/database';
import { JiraModule } from '@/jira/jira.module';
import { QueueModule } from '@/queue/queue.module';
import { SyncConsumer } from './consumers/sync.consumer';
import { SyncScheduler } from './schedulers/sync.scheduler';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    JiraModule,
    QueueModule,
    BullModule.registerQueue(
      { name: QUEUE_NAME.JIRA_SYNC },
      { name: QUEUE_NAME.AI_ANALYSIS },
      { name: QUEUE_NAME.GIT_OPERATION },
      { name: QUEUE_NAME.NOTIFICATION },
    ),
  ],
  providers: [SyncConsumer, SyncScheduler],
})
export class WorkerModule {}

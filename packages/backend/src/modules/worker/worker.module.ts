import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAME } from '@/shared/constants/queue';
import { DatabaseModule } from '@/database';
import { JiraModule } from '@/jira/jira.module';
import { QueueModule } from '@/queue/queue.module';
import { ClaudeModule } from '@/claude/claude.module';
import { GitModule } from '@/git/git.module';
import { SyncConsumer } from './consumers/sync.consumer';
import { AiAnalysisConsumer } from './consumers/ai-analysis.consumer';
import { GitOperationConsumer } from './consumers/git-operation.consumer';
import { SyncScheduler } from './schedulers/sync.scheduler';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    JiraModule,
    QueueModule,
    ClaudeModule,
    GitModule,
    BullModule.registerQueue(
      { name: QUEUE_NAME.JIRA_SYNC },
      { name: QUEUE_NAME.AI_ANALYSIS },
      { name: QUEUE_NAME.GIT_OPERATION },
      { name: QUEUE_NAME.NOTIFICATION },
    ),
  ],
  providers: [SyncConsumer, AiAnalysisConsumer, GitOperationConsumer, SyncScheduler],
})
export class WorkerModule {}

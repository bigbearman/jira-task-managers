import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database';
import { JiraModule } from '@/jira/jira.module';
import { QueueModule } from '@/queue/queue.module';
import { HealthController } from './controllers/health.controller';
import { InstanceController } from './controllers/instance.controller';
import { SyncController } from './controllers/sync.controller';

@Module({
  imports: [DatabaseModule, JiraModule, QueueModule],
  controllers: [HealthController, InstanceController, SyncController],
})
export class ApiModule {}

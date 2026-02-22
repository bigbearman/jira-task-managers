import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database';
import { JiraModule } from '@/jira/jira.module';
import { QueueModule } from '@/queue/queue.module';

// Controllers
import { HealthController } from './controllers/health.controller';
import { InstanceController } from './controllers/instance.controller';
import { SyncController } from './controllers/sync.controller';
import { ProjectController } from './controllers/project.controller';
import { SprintController } from './controllers/sprint.controller';
import { VersionController } from './controllers/version.controller';
import { TicketController } from './controllers/ticket.controller';
import { TaskActionController } from './controllers/task-action.controller';
import { DashboardController } from './controllers/dashboard.controller';

// Services
import { ProjectService } from './services/project.service';
import { SprintService } from './services/sprint.service';
import { VersionService } from './services/version.service';
import { TicketService } from './services/ticket.service';
import { TaskActionService } from './services/task-action.service';
import { DashboardService } from './services/dashboard.service';

@Module({
  imports: [DatabaseModule, JiraModule, QueueModule],
  controllers: [
    HealthController,
    InstanceController,
    SyncController,
    ProjectController,
    SprintController,
    VersionController,
    TicketController,
    TaskActionController,
    DashboardController,
  ],
  providers: [
    ProjectService,
    SprintService,
    VersionService,
    TicketService,
    TaskActionService,
    DashboardService,
  ],
})
export class ApiModule {}

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { HealthController } from '../../src/modules/api/controllers/health.controller';
import { ProjectController } from '../../src/modules/api/controllers/project.controller';
import { TicketController } from '../../src/modules/api/controllers/ticket.controller';
import { TaskActionController } from '../../src/modules/api/controllers/task-action.controller';
import { DashboardController } from '../../src/modules/api/controllers/dashboard.controller';
import { NotificationController } from '../../src/modules/api/controllers/notification.controller';

import { ProjectService } from '../../src/modules/api/services/project.service';
import { TicketService } from '../../src/modules/api/services/ticket.service';
import { TaskActionService } from '../../src/modules/api/services/task-action.service';
import { DashboardService } from '../../src/modules/api/services/dashboard.service';
import { NotificationService } from '../../src/modules/notification/notification.service';
import { GlobalExceptionFilter } from '../../src/modules/api/filters/global-exception.filter';

function createMockService(methods: string[]) {
  const mock: Record<string, jest.Mock> = {};
  for (const m of methods) {
    mock[m] = jest.fn();
  }
  return mock;
}

export function createMockProjectService() {
  return createMockService(['findAll', 'findByKey', 'findByInstance', 'getStats']);
}

export function createMockTicketService() {
  return createMockService([
    'findWithFilters', 'findByKey', 'getComments', 'getWorklogs',
    'getAiAnalysis', 'getGitStatus', 'getActions',
  ]);
}

export function createMockTaskActionService() {
  return createMockService(['analyze', 'approve', 'reject', 'unreject', 'editApproach']);
}

export function createMockDashboardService() {
  return createMockService(['getOverview', 'getSprintVelocity', 'getAiStats']);
}

export function createMockNotificationService() {
  return createMockService(['getUnread', 'getRecent', 'markAsRead', 'markAllAsRead']);
}

// No-op throttler guard for tests
class NoopThrottlerGuard {
  canActivate() {
    return true;
  }
}

export async function createTestApp(): Promise<{
  app: INestApplication;
  projectService: ReturnType<typeof createMockProjectService>;
  ticketService: ReturnType<typeof createMockTicketService>;
  taskActionService: ReturnType<typeof createMockTaskActionService>;
  dashboardService: ReturnType<typeof createMockDashboardService>;
  notificationService: ReturnType<typeof createMockNotificationService>;
}> {
  const projectService = createMockProjectService();
  const ticketService = createMockTicketService();
  const taskActionService = createMockTaskActionService();
  const dashboardService = createMockDashboardService();
  const notificationService = createMockNotificationService();

  const module: TestingModule = await Test.createTestingModule({
    controllers: [
      HealthController,
      ProjectController,
      TicketController,
      TaskActionController,
      DashboardController,
      NotificationController,
    ],
    providers: [
      { provide: ProjectService, useValue: projectService },
      { provide: TicketService, useValue: ticketService },
      { provide: TaskActionService, useValue: taskActionService },
      { provide: DashboardService, useValue: dashboardService },
      { provide: NotificationService, useValue: notificationService },
      { provide: APP_GUARD, useClass: NoopThrottlerGuard },
      { provide: ConfigService, useValue: { get: jest.fn() } },
      { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn(), clear: jest.fn() } },
    ],
  }).compile();

  const app = module.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.init();

  return { app, projectService, ticketService, taskActionService, dashboardService, notificationService };
}

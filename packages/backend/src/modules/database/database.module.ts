import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  JiraInstance,
  Project,
  Sprint,
  Ticket,
  Version,
  Comment,
  Worklog,
  Attachment,
  SyncLog,
  TaskAction,
  AiAnalysis,
  GitOperation,
  Notification,
} from './entities';
import {
  JiraInstanceRepository,
  ProjectRepository,
  SprintRepository,
  TicketRepository,
  VersionRepository,
  SyncLogRepository,
  TaskActionRepository,
  AiAnalysisRepository,
  GitOperationRepository,
  NotificationRepository,
} from './repositories';

const entities = [
  JiraInstance,
  Project,
  Sprint,
  Ticket,
  Version,
  Comment,
  Worklog,
  Attachment,
  SyncLog,
  TaskAction,
  AiAnalysis,
  GitOperation,
  Notification,
];

const repositories = [
  JiraInstanceRepository,
  ProjectRepository,
  SprintRepository,
  TicketRepository,
  VersionRepository,
  SyncLogRepository,
  TaskActionRepository,
  AiAnalysisRepository,
  GitOperationRepository,
  NotificationRepository,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('db.host'),
        port: config.get<number>('db.port'),
        username: config.get<string>('db.username'),
        password: config.get<string>('db.password'),
        database: config.get<string>('db.database'),
        entities,
        synchronize: config.get<boolean>('db.synchronize'),
        logging: config.get<boolean>('db.logging'),
        ssl: config.get<boolean>('db.ssl') ? { rejectUnauthorized: false } : false,
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [...repositories],
  exports: [...repositories, TypeOrmModule],
})
export class DatabaseModule {}

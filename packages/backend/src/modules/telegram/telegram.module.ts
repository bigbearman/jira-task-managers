import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { DatabaseModule } from '@/database';
import { QueueModule } from '@/queue/queue.module';

import { AuthChatIdGuard } from './guards/auth-chat-id.guard';
import { StartCommand } from './commands/start.command';
import { ProjectsCommand } from './commands/projects.command';
import { SprintCommand } from './commands/sprint.command';
import { VersionsCommand } from './commands/versions.command';
import { TicketDetailCommand } from './commands/ticket-detail.command';
import { SyncCommand } from './commands/sync.command';
import { CallbackQueryHandler } from './handlers/callback-query.handler';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.get('telegram.botToken', ''),
        launchOptions: config.get('telegram.pollingEnabled', true)
          ? {
              dropPendingUpdates: true,
              allowedUpdates: ['message', 'callback_query', 'my_chat_member', 'chat_member'],
            }
          : false,
      }),
    }),
    DatabaseModule,
    QueueModule,
  ],
  providers: [
    AuthChatIdGuard,
    StartCommand,
    ProjectsCommand,
    SprintCommand,
    VersionsCommand,
    TicketDetailCommand,
    SyncCommand,
    CallbackQueryHandler,
  ],
})
export class TelegramModule {}

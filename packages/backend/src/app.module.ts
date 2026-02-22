import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  configDb,
  configRedis,
  configJira,
  configTelegram,
  configClaude,
  configGit,
} from '@/shared/config';
import { DatabaseModule } from '@/database';
import { ApiModule } from '@/api/api.module';
import { WorkerModule } from '@/worker/worker.module';

const isApi = process.env.IS_API === '1' || process.env.IS_API === 'true';
const isWorker = process.env.IS_WORKER === '1' || process.env.IS_WORKER === 'true';
const isBot = process.env.IS_BOT === '1' || process.env.IS_BOT === 'true';

// Default: load API if no flags set
const loadApi = isApi || (!isApi && !isWorker && !isBot);

const conditionalModules: any[] = [];
if (loadApi) conditionalModules.push(ApiModule);
if (isWorker) conditionalModules.push(WorkerModule);
// if (isBot) conditionalModules.push(TelegramModule); // Phase 5

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configDb, configRedis, configJira, configTelegram, configClaude, configGit],
    }),
    DatabaseModule,
    ...conditionalModules,
  ],
})
export class AppModule {}

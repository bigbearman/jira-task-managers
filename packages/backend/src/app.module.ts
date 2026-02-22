import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpThrottlerGuard } from '@/shared/guards/http-throttler.guard';
import { redisStore } from 'cache-manager-ioredis-yet';
import {
  configDb,
  configRedis,
  configJira,
  configTelegram,
  configClaude,
  configGit,
} from '@/shared/config';
import { DatabaseModule } from '@/database';
import { NotificationModule } from '@/notification/notification.module';
import { ApiModule } from '@/api/api.module';
import { WorkerModule } from '@/worker/worker.module';
import { TelegramModule } from '@/telegram/telegram.module';

const isApi = process.env.IS_API === '1' || process.env.IS_API === 'true';
const isWorker = process.env.IS_WORKER === '1' || process.env.IS_WORKER === 'true';
const isBot = process.env.IS_BOT === '1' || process.env.IS_BOT === 'true';

// Default: load API if no flags set
const loadApi = isApi || (!isApi && !isWorker && !isBot);

const conditionalModules: any[] = [];
if (loadApi) conditionalModules.push(ApiModule);
if (isWorker) conditionalModules.push(WorkerModule);
if (isBot) conditionalModules.push(TelegramModule);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configDb, configRedis, configJira, configTelegram, configClaude, configGit],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
          db: (config.get<number>('redis.database') ?? 0) + 1,
          ttl: 60,
        }),
      }),
    }),
    DatabaseModule,
    NotificationModule,
    ...conditionalModules,
  ],
  providers: [{ provide: APP_GUARD, useClass: HttpThrottlerGuard }],
})
export class AppModule {}

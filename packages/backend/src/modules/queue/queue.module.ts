import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAME } from '@/shared/constants/queue';
import { QueueService } from './queue.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password'),
          db: config.get<number>('redis.database'),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAME.JIRA_SYNC },
      { name: QUEUE_NAME.AI_ANALYSIS },
      { name: QUEUE_NAME.GIT_OPERATION },
      { name: QUEUE_NAME.NOTIFICATION },
    ),
  ],
  providers: [QueueService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}

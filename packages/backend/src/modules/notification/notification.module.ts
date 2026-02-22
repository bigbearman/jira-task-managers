import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAME } from '@/shared/constants/queue';
import { DatabaseModule } from '@/database';
import { QueueModule } from '@/queue/queue.module';
import { NotificationService } from './notification.service';
import { NotificationConsumer } from './notification.consumer';

@Module({
  imports: [
    DatabaseModule,
    QueueModule,
    BullModule.registerQueue({ name: QUEUE_NAME.NOTIFICATION }),
  ],
  providers: [NotificationService, NotificationConsumer],
  exports: [NotificationService],
})
export class NotificationModule {}

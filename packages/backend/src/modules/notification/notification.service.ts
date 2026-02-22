import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from '@/database';
import { NotificationChannel, NotificationType } from '@/database/entities/notification.entity';
import { QueueService } from '@/queue/queue.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly queueService: QueueService,
  ) {}

  async sendTelegram(
    chatId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    referenceType?: string,
    referenceId?: string,
    topicId?: number,
  ) {
    const notification = this.notificationRepo.create({
      channel: NotificationChannel.TELEGRAM,
      recipient: chatId,
      title,
      message,
      type,
      referenceType: referenceType ?? null,
      referenceId: referenceId ?? null,
    });
    const saved = await this.notificationRepo.save(notification);

    await this.queueService.addTelegramNotification(chatId, message, referenceType, referenceId, topicId);
    this.logger.log(`Queued Telegram notification to ${chatId}: ${title}`);

    return saved;
  }

  async sendWeb(
    recipient: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    referenceType?: string,
    referenceId?: string,
  ) {
    const notification = this.notificationRepo.create({
      channel: NotificationChannel.WEB,
      recipient,
      title,
      message,
      type,
      referenceType: referenceType ?? null,
      referenceId: referenceId ?? null,
      sentAt: new Date(),
    });
    const saved = await this.notificationRepo.save(notification);
    this.logger.log(`Created web notification for ${recipient}: ${title}`);

    return saved;
  }

  async getUnread(recipient: string) {
    return this.notificationRepo.findUnread(recipient);
  }

  async getRecent(recipient: string, limit = 50) {
    return this.notificationRepo.find({
      where: { recipient },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(id: string) {
    await this.notificationRepo.markAsRead(id);
  }

  async markAllAsRead(recipient: string) {
    await this.notificationRepo.markAllAsRead(recipient);
  }
}

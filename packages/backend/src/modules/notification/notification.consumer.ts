import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { Telegraf } from 'telegraf';
import { QUEUE_NAME, QUEUE_PROCESSOR } from '@/shared/constants/queue';
import { NotificationRepository } from '@/database';

@Processor(QUEUE_NAME.NOTIFICATION, { concurrency: 5 })
export class NotificationConsumer extends WorkerHost {
  private readonly logger = new Logger(NotificationConsumer.name);
  private bot: Telegraf | null = null;

  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly configService: ConfigService,
  ) {
    super();
    const botToken = this.configService.get<string>('telegram.botToken');
    if (botToken) {
      this.bot = new Telegraf(botToken);
      this.logger.log('Telegram bot initialized for notifications');
    } else {
      this.logger.warn('No Telegram bot token configured, Telegram notifications disabled');
    }
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case QUEUE_PROCESSOR.NOTIFICATION.SEND_TELEGRAM:
        return this.sendTelegram(job);
      case QUEUE_PROCESSOR.NOTIFICATION.SEND_WEB:
        return this.sendWeb(job);
      default:
        this.logger.warn(`Unknown notification job: ${job.name}`);
    }
  }

  private async sendTelegram(job: Job) {
    const { chatId, message, notificationId } = job.data;

    if (!this.bot) {
      this.logger.warn('Telegram bot not configured, skipping notification');
      return;
    }

    try {
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
      this.logger.log(`Telegram notification sent to ${chatId}`);

      if (notificationId) {
        await this.notificationRepo.update(notificationId, { sentAt: new Date() });
      }
    } catch (error) {
      this.logger.error(`Failed to send Telegram notification to ${chatId}: ${error.message}`);
      throw error;
    }
  }

  private async sendWeb(job: Job) {
    const { notificationId } = job.data;

    if (notificationId) {
      await this.notificationRepo.update(notificationId, { sentAt: new Date() });
      this.logger.log(`Web notification ${notificationId} marked as sent`);
    }
  }
}

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
  private readonly defaultTopicId: number | undefined;

  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly configService: ConfigService,
  ) {
    super();
    const botToken = this.configService.get<string>('telegram.botToken');
    this.defaultTopicId = this.configService.get<number>('telegram.defaultTopicId');
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
    const { chatId, message, notificationId, topicId } = job.data;

    if (!this.bot) {
      this.logger.warn('Telegram bot not configured, skipping notification');
      return;
    }

    try {
      const messageThreadId = topicId ?? this.defaultTopicId;
      const options: Record<string, any> = { parse_mode: 'HTML' };
      if (messageThreadId) {
        options.message_thread_id = messageThreadId;
      }

      await this.bot.telegram.sendMessage(chatId, message, options);
      this.logger.log(`Telegram notification sent to ${chatId}${messageThreadId ? ` (topic ${messageThreadId})` : ''}`);

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

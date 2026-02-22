import { Injectable, Logger } from '@nestjs/common';
import { Use, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
@Injectable()
export class LoggingMiddleware {
  private readonly logger = new Logger('TelegramBot');

  @Use()
  async onUpdate(ctx: Context, next: () => Promise<void>) {
    const chatId = ctx.chat?.id;
    const chatType = ctx.chat?.type;
    const messageThreadId = (ctx.message as any)?.message_thread_id;
    const text = (ctx.message as any)?.text || '';
    const updateType = ctx.updateType;

    this.logger.log(
      `[${updateType}] chat=${chatId} type=${chatType} topic=${messageThreadId ?? 'none'} text="${text.slice(0, 50)}"`,
    );

    await next();
  }
}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Injectable()
export class AuthChatIdGuard implements CanActivate {
  private readonly allowedChatIds: string[];

  constructor(private readonly configService: ConfigService) {
    this.allowedChatIds = this.configService.get('telegram.allowedChatIds', []);
  }

  canActivate(context: ExecutionContext): boolean {
    const ctx = TelegrafExecutionContext.create(context);
    const tgCtx = ctx.getContext<Context>();
    const chatId = tgCtx.chat?.id?.toString();

    if (!chatId) return false;
    if (this.allowedChatIds.length === 0) return true; // No restriction if empty
    return this.allowedChatIds.includes(chatId);
  }
}

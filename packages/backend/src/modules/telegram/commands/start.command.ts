import { Command, Ctx, Help, Start, Update } from 'nestjs-telegraf';
import { UseGuards } from '@nestjs/common';
import { Context } from 'telegraf';
import { AuthChatIdGuard } from '../guards/auth-chat-id.guard';

@Update()
@UseGuards(AuthChatIdGuard)
export class StartCommand {
  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.replyWithMarkdownV2(
      [
        '*🚀 Multi Jira Task Manager*',
        '',
        'Manage your Jira tasks with AI\\-powered analysis\\.',
        '',
        '*Commands:*',
        '/projects \\- List all projects',
        '/sprint \\[name\\] \\- Active sprint tickets',
        '/versions \\[project\\] \\- List versions',
        '/ticket KEY\\-123 \\- Ticket detail',
        '/sync \\- Trigger Jira sync',
        '/status \\- Sync status',
        '/help \\- Show this help',
      ].join('\n'),
    );
  }

  @Help()
  async onHelp(@Ctx() ctx: Context) {
    await this.onStart(ctx);
  }
}

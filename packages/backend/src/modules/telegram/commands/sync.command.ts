import { Command, Ctx, Update } from 'nestjs-telegraf';
import { UseGuards } from '@nestjs/common';
import { Context } from 'telegraf';
import { JiraInstanceRepository, SyncLogRepository } from '@/database';
import { QueueService } from '@/queue/queue.service';
import { AuthChatIdGuard } from '../guards/auth-chat-id.guard';

@Update()
@UseGuards(AuthChatIdGuard)
export class SyncCommand {
  constructor(
    private readonly instanceRepo: JiraInstanceRepository,
    private readonly syncLogRepo: SyncLogRepository,
    private readonly queueService: QueueService,
  ) {}

  @Command('sync')
  async onSync(@Ctx() ctx: Context) {
    const instances = await this.instanceRepo.findSyncEnabled();

    if (instances.length === 0) {
      await ctx.reply('No Jira instances configured. Add one via API first.');
      return;
    }

    for (const instance of instances) {
      await this.queueService.addSyncAllJob(instance.id, `telegram:${ctx.chat?.id}`);
    }

    await ctx.reply(
      `🔄 Sync triggered for ${instances.length} instance(s):\n` +
        instances.map((i) => `• ${i.name} (${i.slug})`).join('\n'),
    );
  }

  @Command('status')
  async onStatus(@Ctx() ctx: Context) {
    const logs = await this.syncLogRepo.findRecent(5);

    if (logs.length === 0) {
      await ctx.reply('No sync logs found. Run /sync first.');
      return;
    }

    const lines = ['📊 *Recent Sync Logs:*', ''];
    for (const log of logs) {
      const status =
        log.status === 'completed' ? '✅' :
        log.status === 'failed' ? '❌' :
        log.status === 'running' ? '🔄' : '⏳';
      const date = log.startedAt
        ? new Date(log.startedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        : 'N/A';

      lines.push(
        `${status} ${log.syncType} \\- ${log.status}`,
        `   📅 ${date.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
        `   📦 ${log.itemsProcessed ?? 0} processed, ${log.itemsCreated ?? 0} created, ${log.itemsUpdated ?? 0} updated`,
        '',
      );
    }

    await ctx.replyWithMarkdownV2(lines.join('\n'));
  }
}

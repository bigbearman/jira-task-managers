import { Command, Ctx, Update } from 'nestjs-telegraf';
import { UseGuards } from '@nestjs/common';
import { Context } from 'telegraf';
import { TicketRepository, AiAnalysisRepository, GitOperationRepository } from '@/database';
import { AuthChatIdGuard } from '../guards/auth-chat-id.guard';
import { InlineKeyboardBuilder } from '../keyboards/inline-keyboard.builder';
import {
  escapeMarkdownV2,
  bold,
  code,
  splitMessage,
} from '@/shared/utils/telegram-formatter';
import { getStatusIcon, getPriorityIcon, getTypeIcon } from '@/shared/constants/jira';
import { parseAdfToText } from '@/shared/utils/jira-adf-parser';

@Update()
@UseGuards(AuthChatIdGuard)
export class TicketDetailCommand {
  constructor(
    private readonly ticketRepo: TicketRepository,
    private readonly aiAnalysisRepo: AiAnalysisRepository,
    private readonly gitOperationRepo: GitOperationRepository,
  ) {}

  @Command('ticket')
  async onTicket(@Ctx() ctx: Context) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const args = message.text.split(' ').slice(1);
    const ticketKey = args[0]?.toUpperCase();

    if (!ticketKey) {
      await ctx.reply('Usage: /ticket KEY-123');
      return;
    }

    await this.sendTicketDetail(ctx, ticketKey);
  }

  async sendTicketDetail(ctx: Context, ticketKey: string) {
    const ticket = await this.ticketRepo.findByKey(ticketKey);
    if (!ticket) {
      await ctx.reply(`Ticket '${ticketKey}' not found.`);
      return;
    }

    const status = getStatusIcon(ticket.status ?? '');
    const priority = getPriorityIcon(ticket.priority ?? '');
    const type = getTypeIcon(ticket.issueType ?? '');

    const lines = [
      `${type} ${bold(ticket.jiraTicketKey)} ${escapeMarkdownV2(ticket.summary)}`,
      '',
      `${status} Status: ${escapeMarkdownV2(ticket.status ?? 'Unknown')}`,
      `${priority} Priority: ${escapeMarkdownV2(ticket.priority ?? 'None')}`,
      `📌 Type: ${escapeMarkdownV2(ticket.issueType ?? 'Unknown')}`,
    ];

    if (ticket.assigneeDisplayName) {
      lines.push(`👤 Assignee: ${escapeMarkdownV2(ticket.assigneeDisplayName)}`);
    }
    if (ticket.storyPoints) {
      lines.push(`📊 Story Points: ${ticket.storyPoints}`);
    }
    if (ticket.labels?.length) {
      lines.push(`🏷 Labels: ${escapeMarkdownV2(ticket.labels.join(', '))}`);
    }

    // Description (truncated)
    if (ticket.description) {
      const desc = parseAdfToText(ticket.description);
      if (desc) {
        const truncated = desc.length > 300 ? desc.substring(0, 300) + '...' : desc;
        lines.push('', `📝 *Description:*`, escapeMarkdownV2(truncated));
      }
    }

    // AI Analysis
    const analysis = await this.aiAnalysisRepo.findLatestByTicketId(ticket.id);
    if (analysis?.status === 'completed' && analysis.response) {
      const summary = analysis.response.substring(0, 200);
      lines.push('', `🤖 *AI Analysis:*`, escapeMarkdownV2(summary + '...'));
    }

    // Git Status
    const gitOps = await this.gitOperationRepo.findByTicketId(ticket.id);
    const latestPr = gitOps.find((op) => op.operationType === 'pr_create' && op.prUrl);
    if (latestPr) {
      lines.push('', `🔀 PR: ${latestPr.prUrl}`);
    }

    const chunks = splitMessage(lines.join('\n'));

    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      await ctx.replyWithMarkdownV2(
        chunks[i],
        isLast ? InlineKeyboardBuilder.ticketActions(ticket.jiraTicketKey) : undefined,
      );
    }
  }
}

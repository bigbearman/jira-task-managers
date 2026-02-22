import { Command, Ctx, Update } from 'nestjs-telegraf';
import { UseGuards } from '@nestjs/common';
import { Context } from 'telegraf';
import { SprintRepository, TicketRepository } from '@/database';
import { AuthChatIdGuard } from '../guards/auth-chat-id.guard';
import { getStatusIcon, getPriorityIcon, getTypeIcon } from '@/shared/constants/jira';
import { escapeMarkdownV2 } from '@/shared/utils/telegram-formatter';

@Update()
@UseGuards(AuthChatIdGuard)
export class SprintCommand {
  constructor(
    private readonly sprintRepo: SprintRepository,
    private readonly ticketRepo: TicketRepository,
  ) {}

  @Command('sprint')
  async onSprint(@Ctx() ctx: Context) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const args = message.text.split(' ').slice(1);
    const sprintName = args.join(' ');

    // Get active sprints
    const activeSprints = await this.sprintRepo.findActive();
    if (activeSprints.length === 0) {
      await ctx.reply('No active sprints found.');
      return;
    }

    // Find matching sprint or use first active
    let sprint = activeSprints[0];
    if (sprintName) {
      const match = activeSprints.find((s) =>
        s.name.toLowerCase().includes(sprintName.toLowerCase()),
      );
      if (match) sprint = match;
    }

    // Get tickets for this sprint
    const [tickets] = await this.ticketRepo.findWithFilters({
      sprintId: sprint.id,
      page: 1,
      limit: 30,
    });

    const lines = [
      `🏃 *${escapeMarkdownV2(sprint.name)}*`,
      `State: ${sprint.state}`,
      '',
    ];

    if (tickets.length === 0) {
      lines.push('No tickets in this sprint\\.');
    } else {
      for (const t of tickets) {
        const status = getStatusIcon(t.status ?? '');
        const priority = getPriorityIcon(t.priority ?? '');
        const type = getTypeIcon(t.issueType ?? '');
        const key = escapeMarkdownV2(t.jiraTicketKey);
        const summary = escapeMarkdownV2(
          t.summary.length > 50 ? t.summary.substring(0, 50) + '...' : t.summary,
        );
        lines.push(`${status}${priority}${type} \`${key}\` ${summary}`);
      }
    }

    lines.push('', `Total: ${tickets.length} tickets`);

    await ctx.replyWithMarkdownV2(lines.join('\n'));
  }
}

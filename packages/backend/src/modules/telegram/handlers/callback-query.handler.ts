import { Action, Ctx, Update } from 'nestjs-telegraf';
import { UseGuards } from '@nestjs/common';
import { Context } from 'telegraf';
import {
  TicketRepository,
  TaskActionRepository,
  AiAnalysisRepository,
  ActionType,
  ActionStatus,
} from '@/database';
import { QueueService } from '@/queue/queue.service';
import { AuthChatIdGuard } from '../guards/auth-chat-id.guard';
import { InlineKeyboardBuilder } from '../keyboards/inline-keyboard.builder';
import { TicketDetailCommand } from '../commands/ticket-detail.command';

@Update()
@UseGuards(AuthChatIdGuard)
export class CallbackQueryHandler {
  constructor(
    private readonly ticketRepo: TicketRepository,
    private readonly taskActionRepo: TaskActionRepository,
    private readonly aiAnalysisRepo: AiAnalysisRepository,
    private readonly queueService: QueueService,
    private readonly ticketDetailCommand: TicketDetailCommand,
  ) {}

  @Action(/^ticket:detail:(.+)$/)
  async onTicketDetail(@Ctx() ctx: Context) {
    if (!('data' in (ctx.callbackQuery ?? {}))) return;
    const data = (ctx.callbackQuery as any).data as string;
    const ticketKey = data.split(':')[2];

    await ctx.answerCbQuery('Loading...');
    await this.ticketDetailCommand.sendTicketDetail(ctx, ticketKey);
  }

  @Action(/^action:analyze:(.+)$/)
  async onAnalyze(@Ctx() ctx: Context) {
    if (!('data' in (ctx.callbackQuery ?? {}))) return;
    const data = (ctx.callbackQuery as any).data as string;
    const ticketKey = data.split(':')[2];

    const ticket = await this.ticketRepo.findByKeySimple(ticketKey);
    if (!ticket) {
      await ctx.answerCbQuery(`Ticket ${ticketKey} not found`);
      return;
    }

    const action = this.taskActionRepo.create({
      ticketId: ticket.id,
      actionType: ActionType.APPROVED,
      status: ActionStatus.PENDING,
      triggeredBy: `telegram:${ctx.chat?.id}`,
    });
    const saved = await this.taskActionRepo.save(action);
    await this.queueService.addAnalyzeTicketJob(ticket.id, saved.id);

    await ctx.answerCbQuery('Analysis queued!');
    await ctx.reply(`🤖 Analysis queued for ${ticketKey}. You'll be notified when complete.`);
  }

  @Action(/^action:approve:(.+)$/)
  async onApprove(@Ctx() ctx: Context) {
    if (!('data' in (ctx.callbackQuery ?? {}))) return;
    const data = (ctx.callbackQuery as any).data as string;
    const ticketKey = data.split(':')[2];

    const ticket = await this.ticketRepo.findByKeySimple(ticketKey);
    if (!ticket) {
      await ctx.answerCbQuery(`Ticket ${ticketKey} not found`);
      return;
    }

    // Check if rejected
    const latest = await this.taskActionRepo.findLatestByTicketId(ticket.id);
    if (latest?.actionType === ActionType.REJECTED && latest.status !== ActionStatus.CANCELLED) {
      await ctx.answerCbQuery('Ticket is rejected. Unreject first.');
      return;
    }

    const action = this.taskActionRepo.create({
      ticketId: ticket.id,
      actionType: ActionType.APPROVED,
      status: ActionStatus.PENDING,
      inputContext: { targetBranch: 'develop' },
      triggeredBy: `telegram:${ctx.chat?.id}`,
    });
    const saved = await this.taskActionRepo.save(action);
    await this.queueService.addFullApproveFlowJob(ticket.id, saved.id);

    await ctx.answerCbQuery('Approve flow started!');
    await ctx.reply(
      `✅ Approve flow started for ${ticketKey}:\n` +
        '1. Create branch\n2. Apply code (Claude)\n3. Run tests\n4. Commit & push\n5. Create PR',
    );
  }

  @Action(/^action:reject:(.+)$/)
  async onReject(@Ctx() ctx: Context) {
    if (!('data' in (ctx.callbackQuery ?? {}))) return;
    const data = (ctx.callbackQuery as any).data as string;
    const ticketKey = data.split(':')[2];

    const ticket = await this.ticketRepo.findByKeySimple(ticketKey);
    if (!ticket) {
      await ctx.answerCbQuery(`Ticket ${ticketKey} not found`);
      return;
    }

    const action = this.taskActionRepo.create({
      ticketId: ticket.id,
      actionType: ActionType.REJECTED,
      status: ActionStatus.COMPLETED,
      triggeredBy: `telegram:${ctx.chat?.id}`,
    });
    await this.taskActionRepo.save(action);

    await ctx.answerCbQuery('Ticket rejected');
    await ctx.reply(
      `❌ ${ticketKey} rejected.`,
      InlineKeyboardBuilder.afterReject(ticketKey),
    );
  }

  @Action(/^action:unreject:(.+)$/)
  async onUnreject(@Ctx() ctx: Context) {
    if (!('data' in (ctx.callbackQuery ?? {}))) return;
    const data = (ctx.callbackQuery as any).data as string;
    const ticketKey = data.split(':')[2];

    const ticket = await this.ticketRepo.findByKeySimple(ticketKey);
    if (!ticket) {
      await ctx.answerCbQuery(`Ticket ${ticketKey} not found`);
      return;
    }

    const latest = await this.taskActionRepo.findLatestByTicketId(ticket.id);
    if (!latest || latest.actionType !== ActionType.REJECTED) {
      await ctx.answerCbQuery('Ticket is not rejected');
      return;
    }

    await this.taskActionRepo.update(latest.id, { status: ActionStatus.CANCELLED });

    const action = this.taskActionRepo.create({
      ticketId: ticket.id,
      actionType: ActionType.UNREJECTED,
      status: ActionStatus.COMPLETED,
      triggeredBy: `telegram:${ctx.chat?.id}`,
    });
    await this.taskActionRepo.save(action);

    await ctx.answerCbQuery('Ticket unrejected');
    await ctx.reply(
      `↩️ ${ticketKey} unrejected.`,
      InlineKeyboardBuilder.ticketActions(ticketKey),
    );
  }

  @Action(/^project:detail:(.+)$/)
  async onProjectDetail(@Ctx() ctx: Context) {
    if (!('data' in (ctx.callbackQuery ?? {}))) return;
    const data = (ctx.callbackQuery as any).data as string;
    const projectKey = data.split(':')[2];

    await ctx.answerCbQuery('Loading sprints...');

    // Show active sprints for this project
    const project = await this.ticketRepo.manager
      .createQueryBuilder()
      .select('jira_project_id')
      .from('jira_projects', 'p')
      .where('p.jira_project_key = :key', { key: projectKey })
      .getRawOne();

    if (!project) {
      await ctx.reply(`Project ${projectKey} not found.`);
      return;
    }

    const { SprintRepository: _ignore, ...rest } = {} as any;
    const sprints = await this.ticketRepo.manager
      .createQueryBuilder()
      .select('*')
      .from('jira_sprints', 's')
      .where('s.jira_project_id = :pid', { pid: project.jira_project_id })
      .andWhere('s.deleted_at IS NULL')
      .orderBy('s.start_date', 'DESC')
      .limit(10)
      .getRawMany();

    if (sprints.length === 0) {
      await ctx.reply(`No sprints found for ${projectKey}.`);
      return;
    }

    const sprintList = sprints.map((s: any) => ({
      id: s.id,
      name: s.name,
      state: s.state,
    }));

    await ctx.reply(
      `🏃 Sprints for ${projectKey}:`,
      InlineKeyboardBuilder.sprintList(sprintList),
    );
  }

  @Action('noop')
  async onNoop(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
  }
}

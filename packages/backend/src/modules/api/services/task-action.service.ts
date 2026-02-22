import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  TicketRepository,
  TaskActionRepository,
  AiAnalysisRepository,
  GitOperationRepository,
  ActionType,
  ActionStatus,
} from '@/database';
import { QueueService } from '@/queue/queue.service';
import { AnalyzeTicketDto, ApproveTicketDto, EditApproachDto } from '../dtos';

@Injectable()
export class TaskActionService {
  constructor(
    private readonly ticketRepo: TicketRepository,
    private readonly taskActionRepo: TaskActionRepository,
    private readonly aiAnalysisRepo: AiAnalysisRepository,
    private readonly gitOperationRepo: GitOperationRepository,
    private readonly queueService: QueueService,
  ) {}

  async analyze(key: string, dto: AnalyzeTicketDto) {
    const ticket = await this.ticketRepo.findByKeySimple(key);
    if (!ticket) throw new NotFoundException(`Ticket '${key}' not found`);

    const action = this.taskActionRepo.create({
      ticketId: ticket.id,
      actionType: ActionType.APPROVED,
      status: ActionStatus.PENDING,
      inputContext: dto.customPrompt ? { customPrompt: dto.customPrompt } : null,
      triggeredBy: dto.triggeredBy ?? 'web',
    });
    const saved = await this.taskActionRepo.save(action);

    await this.queueService.addAnalyzeTicketJob(ticket.id, saved.id);
    return saved;
  }

  async approve(key: string, dto: ApproveTicketDto) {
    const ticket = await this.ticketRepo.findByKeySimple(key);
    if (!ticket) throw new NotFoundException(`Ticket '${key}' not found`);

    const latest = await this.taskActionRepo.findLatestByTicketId(ticket.id);
    if (latest?.actionType === ActionType.REJECTED && latest.status !== ActionStatus.CANCELLED) {
      throw new BadRequestException(`Ticket '${key}' is rejected. Unreject first.`);
    }

    const action = this.taskActionRepo.create({
      ticketId: ticket.id,
      actionType: ActionType.APPROVED,
      status: ActionStatus.PENDING,
      inputContext: {
        approach: dto.approach,
        projectPath: dto.projectPath,
        targetBranch: dto.targetBranch ?? 'develop',
      },
      triggeredBy: dto.triggeredBy ?? 'web',
    });
    const saved = await this.taskActionRepo.save(action);

    await this.queueService.addFullApproveFlowJob(ticket.id, saved.id);
    return saved;
  }

  async reject(key: string, triggeredBy?: string) {
    const ticket = await this.ticketRepo.findByKeySimple(key);
    if (!ticket) throw new NotFoundException(`Ticket '${key}' not found`);

    const action = this.taskActionRepo.create({
      ticketId: ticket.id,
      actionType: ActionType.REJECTED,
      status: ActionStatus.COMPLETED,
      triggeredBy: triggeredBy ?? 'web',
    });
    return this.taskActionRepo.save(action);
  }

  async unreject(key: string, triggeredBy?: string) {
    const ticket = await this.ticketRepo.findByKeySimple(key);
    if (!ticket) throw new NotFoundException(`Ticket '${key}' not found`);

    const latest = await this.taskActionRepo.findLatestByTicketId(ticket.id);
    if (!latest || latest.actionType !== ActionType.REJECTED) {
      throw new BadRequestException(`Ticket '${key}' is not rejected`);
    }

    await this.taskActionRepo.update(latest.id, { status: ActionStatus.CANCELLED });

    const action = this.taskActionRepo.create({
      ticketId: ticket.id,
      actionType: ActionType.UNREJECTED,
      status: ActionStatus.COMPLETED,
      triggeredBy: triggeredBy ?? 'web',
    });
    return this.taskActionRepo.save(action);
  }

  async editApproach(key: string, dto: EditApproachDto) {
    const ticket = await this.ticketRepo.findByKeySimple(key);
    if (!ticket) throw new NotFoundException(`Ticket '${key}' not found`);

    const action = this.taskActionRepo.create({
      ticketId: ticket.id,
      actionType: ActionType.EDIT_APPROACH,
      status: ActionStatus.COMPLETED,
      inputContext: {
        approach: dto.approach,
        inputContext: dto.inputContext,
        expectedOutput: dto.expectedOutput,
      },
      triggeredBy: dto.triggeredBy ?? 'web',
    });
    return this.taskActionRepo.save(action);
  }
}

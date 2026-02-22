import { Injectable, NotFoundException } from '@nestjs/common';
import {
  TicketRepository,
  TaskActionRepository,
  AiAnalysisRepository,
  GitOperationRepository,
  JiraInstanceRepository,
} from '@/database';
import { TicketFilterOptions } from '@/database';
import { paginate, getDefaultPagination } from '@/shared/utils/pagination';

@Injectable()
export class TicketService {
  constructor(
    private readonly ticketRepo: TicketRepository,
    private readonly taskActionRepo: TaskActionRepository,
    private readonly aiAnalysisRepo: AiAnalysisRepository,
    private readonly gitOperationRepo: GitOperationRepository,
    private readonly instanceRepo: JiraInstanceRepository,
  ) {}

  async findWithFilters(filters: TicketFilterOptions) {
    const pagination = getDefaultPagination(filters.page, filters.limit);
    const [tickets, total] = await this.ticketRepo.findWithFilters({
      ...filters,
      ...pagination,
    });
    return paginate(tickets, total, pagination);
  }

  async findByKey(key: string) {
    const ticket = await this.ticketRepo.findByKey(key);
    if (!ticket) throw new NotFoundException(`Ticket '${key}' not found`);
    return ticket;
  }

  async getComments(key: string) {
    const ticket = await this.ticketRepo.findByKeySimple(key);
    if (!ticket) throw new NotFoundException(`Ticket '${key}' not found`);

    const { Comment } = await import('@/database');
    const commentRepo = this.ticketRepo.manager.getRepository(Comment);
    return commentRepo.find({
      where: { ticketId: ticket.id },
      order: { jiraCreatedAt: 'DESC' },
    });
  }

  async getWorklogs(key: string) {
    const ticket = await this.ticketRepo.findByKeySimple(key);
    if (!ticket) throw new NotFoundException(`Ticket '${key}' not found`);

    const { Worklog } = await import('@/database');
    const worklogRepo = this.ticketRepo.manager.getRepository(Worklog);
    return worklogRepo.find({
      where: { ticketId: ticket.id },
      order: { startedAt: 'DESC' },
    });
  }

  async getAiAnalysis(key: string) {
    const ticket = await this.ticketRepo.findByKeySimple(key);
    if (!ticket) throw new NotFoundException(`Ticket '${key}' not found`);
    return this.aiAnalysisRepo.findByTicketId(ticket.id);
  }

  async getGitStatus(key: string) {
    const ticket = await this.ticketRepo.findByKeySimple(key);
    if (!ticket) throw new NotFoundException(`Ticket '${key}' not found`);
    return this.gitOperationRepo.findByTicketId(ticket.id);
  }

  async getActions(key: string) {
    const ticket = await this.ticketRepo.findByKeySimple(key);
    if (!ticket) throw new NotFoundException(`Ticket '${key}' not found`);
    return this.taskActionRepo.findByTicketId(ticket.id);
  }

  async getInstanceForTicket(key: string) {
    const ticket = await this.ticketRepo.findOne({
      where: { jiraTicketKey: key },
      relations: ['project', 'project.instance'],
    });
    if (!ticket?.project?.instance) throw new NotFoundException(`Cannot resolve instance for '${key}'`);
    return ticket.project.instance;
  }
}

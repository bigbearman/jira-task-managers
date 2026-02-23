import { Injectable, NotFoundException } from '@nestjs/common';
import { SprintRepository, TicketRepository } from '@/database';
import { paginate, getDefaultPagination } from '@/shared/utils/pagination';

@Injectable()
export class SprintService {
  constructor(
    private readonly sprintRepo: SprintRepository,
    private readonly ticketRepo: TicketRepository,
  ) {}

  async findByProject(projectKey: string) {
    const project = await this.sprintRepo.manager
      .createQueryBuilder()
      .select('jira_project_id')
      .from('jira_projects', 'p')
      .where('p.jira_project_key = :key', { key: projectKey })
      .andWhere('p.deleted_at IS NULL')
      .getRawOne();

    if (!project) throw new NotFoundException(`Project '${projectKey}' not found`);
    return this.sprintRepo.findByProjectId(project.jira_project_id);
  }

  async findById(id: string) {
    const sprint = await this.sprintRepo.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!sprint) throw new NotFoundException(`Sprint not found`);
    return sprint;
  }

  async findActive(projectKey?: string) {
    if (projectKey) {
      const project = await this.sprintRepo.manager
        .createQueryBuilder()
        .select('jira_project_id')
        .from('jira_projects', 'p')
        .where('p.jira_project_key = :key', { key: projectKey })
        .getRawOne();
      return this.sprintRepo.findActive(project?.jira_project_id);
    }
    return this.sprintRepo.findActive();
  }

  async getTickets(id: string, page = 1, limit = 20) {
    const sprint = await this.sprintRepo.findOne({ where: { id } });
    if (!sprint) throw new NotFoundException(`Sprint not found`);

    const pagination = getDefaultPagination(page, limit);
    const [tickets, total] = await this.ticketRepo.findWithFilters({ sprintId: id, ...pagination });
    return paginate(tickets, total, pagination);
  }

  async getSprintStats(id: string) {
    const sprint = await this.sprintRepo.findOne({ where: { id } });
    if (!sprint) throw new NotFoundException(`Sprint not found`);

    const stats = await this.ticketRepo.manager
      .createQueryBuilder()
      .select('t.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(t.story_points), 0)', 'points')
      .from('jira_tickets', 't')
      .innerJoin('jira_ticket_sprint', 'ts', 'ts.ticket_id = t.id')
      .where('ts.sprint_id = :sprintId', { sprintId: id })
      .andWhere('t.deleted_at IS NULL')
      .groupBy('t.status')
      .getRawMany();

    return { sprint, stats };
  }
}

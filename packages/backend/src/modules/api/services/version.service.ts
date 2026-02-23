import { Injectable, NotFoundException } from '@nestjs/common';
import { VersionRepository, TicketRepository } from '@/database';
import { paginate, getDefaultPagination } from '@/shared/utils/pagination';

@Injectable()
export class VersionService {
  constructor(
    private readonly versionRepo: VersionRepository,
    private readonly ticketRepo: TicketRepository,
  ) {}

  async findByProject(projectKey: string) {
    const project = await this.versionRepo.manager
      .createQueryBuilder()
      .select('jira_project_id')
      .from('jira_projects', 'p')
      .where('p.jira_project_key = :key', { key: projectKey })
      .andWhere('p.deleted_at IS NULL')
      .getRawOne();

    if (!project) throw new NotFoundException(`Project '${projectKey}' not found`);
    return this.versionRepo.findByProjectId(project.jira_project_id);
  }

  async findById(id: string) {
    const version = await this.versionRepo.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!version) throw new NotFoundException(`Version not found`);
    return version;
  }

  async findUnreleased(projectKey?: string) {
    if (projectKey) {
      const project = await this.versionRepo.manager
        .createQueryBuilder()
        .select('jira_project_id')
        .from('jira_projects', 'p')
        .where('p.jira_project_key = :key', { key: projectKey })
        .getRawOne();
      return this.versionRepo.findUnreleased(project?.jira_project_id);
    }
    return this.versionRepo.findUnreleased();
  }

  async getTickets(id: string, page = 1, limit = 20) {
    const version = await this.versionRepo.findOne({ where: { id } });
    if (!version) throw new NotFoundException(`Version not found`);

    const pagination = getDefaultPagination(page, limit);
    const [tickets, total] = await this.ticketRepo.findWithFilters({ versionId: id, ...pagination });
    return paginate(tickets, total, pagination);
  }
}

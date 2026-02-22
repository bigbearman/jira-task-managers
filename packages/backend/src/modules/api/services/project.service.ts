import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository, JiraInstanceRepository } from '@/database';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly instanceRepo: JiraInstanceRepository,
  ) {}

  async findAll() {
    return this.projectRepo.findAllActive();
  }

  async findByInstance(instanceSlug: string) {
    const instance = await this.instanceRepo.findBySlug(instanceSlug);
    if (!instance) throw new NotFoundException(`Instance '${instanceSlug}' not found`);
    return this.projectRepo.findByInstanceId(instance.id);
  }

  async findByKey(key: string) {
    const project = await this.projectRepo.findByKey(key);
    if (!project) throw new NotFoundException(`Project '${key}' not found`);
    return project;
  }

  async getStats(key: string) {
    const project = await this.projectRepo.findByKey(key);
    if (!project) throw new NotFoundException(`Project '${key}' not found`);

    const ticketCount = await this.projectRepo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'total')
      .addSelect(`COUNT(*) FILTER (WHERE status IN ('Done', 'Closed', 'Resolved'))`, 'done')
      .addSelect(`COUNT(*) FILTER (WHERE status IN ('In Progress', 'Development'))`, 'inProgress')
      .addSelect(`COUNT(*) FILTER (WHERE status IN ('To Do', 'Open', 'New', 'Backlog'))`, 'todo')
      .from('jira_tickets', 't')
      .where('t.jira_project_id = :pid', { pid: project.jiraProjectId })
      .andWhere('t.deleted_at IS NULL')
      .getRawOne();

    const sprintCount = await this.projectRepo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'total')
      .addSelect(`COUNT(*) FILTER (WHERE state = 'active')`, 'active')
      .from('jira_sprints', 's')
      .where('s.jira_project_id = :pid', { pid: project.jiraProjectId })
      .andWhere('s.deleted_at IS NULL')
      .getRawOne();

    const versionCount = await this.projectRepo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'total')
      .addSelect(`COUNT(*) FILTER (WHERE is_released = false AND is_archived = false)`, 'unreleased')
      .from('jira_versions', 'v')
      .where('v.jira_project_id = :pid', { pid: project.jiraProjectId })
      .andWhere('v.deleted_at IS NULL')
      .getRawOne();

    return {
      project,
      tickets: {
        total: Number(ticketCount.total),
        done: Number(ticketCount.done),
        inProgress: Number(ticketCount.inProgress),
        todo: Number(ticketCount.todo),
      },
      sprints: {
        total: Number(sprintCount.total),
        active: Number(sprintCount.active),
      },
      versions: {
        total: Number(versionCount.total),
        unreleased: Number(versionCount.unreleased),
      },
    };
  }
}

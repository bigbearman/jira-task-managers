import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Ticket } from '../entities';

export interface TicketFilterOptions {
  projectKey?: string;
  sprintId?: string;
  versionId?: string;
  status?: string;
  assignee?: string;
  issueType?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class TicketRepository extends Repository<Ticket> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Ticket, dataSource.createEntityManager());
  }

  async findByKey(key: string): Promise<Ticket | null> {
    return this.findOne({
      where: { jiraTicketKey: key, deletedAt: undefined },
      relations: ['project', 'comments', 'worklogs', 'sprints', 'fixVersions', 'taskActions', 'aiAnalyses', 'gitOperations'],
    });
  }

  async findByKeySimple(key: string): Promise<Ticket | null> {
    return this.findOne({ where: { jiraTicketKey: key, deletedAt: undefined } });
  }

  async findWithFilters(options: TicketFilterOptions): Promise<[Ticket[], number]> {
    const qb = this.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.project', 'project')
      .where('ticket.deletedAt IS NULL');

    if (options.projectKey) {
      qb.andWhere('project.jiraProjectKey = :projectKey', { projectKey: options.projectKey });
    }
    if (options.status) {
      qb.andWhere('ticket.status = :status', { status: options.status });
    }
    if (options.assignee) {
      qb.andWhere('ticket.assigneeDisplayName ILIKE :assignee', { assignee: `%${options.assignee}%` });
    }
    if (options.issueType) {
      qb.andWhere('ticket.issueType = :issueType', { issueType: options.issueType });
    }
    if (options.sprintId) {
      qb.innerJoin('ticket.sprints', 'sprint', 'sprint.id = :sprintId', { sprintId: options.sprintId });
    }
    if (options.versionId) {
      qb.innerJoin('ticket.fixVersions', 'version', 'version.id = :versionId', { versionId: options.versionId });
    }

    const page = options.page || 1;
    const limit = options.limit || 20;
    qb.orderBy('ticket.jiraUpdatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return qb.getManyAndCount();
  }

  async findBySprintJiraId(jiraSprintId: number): Promise<Ticket[]> {
    return this.createQueryBuilder('ticket')
      .innerJoin('ticket.sprints', 'sprint')
      .where('sprint.jiraSprintId = :jiraSprintId', { jiraSprintId })
      .andWhere('ticket.deletedAt IS NULL')
      .orderBy('ticket.status', 'ASC')
      .addOrderBy('ticket.priority', 'ASC')
      .getMany();
  }
}

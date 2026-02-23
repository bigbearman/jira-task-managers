import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Project } from '../entities';

@Injectable()
export class ProjectRepository extends Repository<Project> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Project, dataSource.createEntityManager());
  }

  async findByKey(key: string): Promise<Project | null> {
    return this.findOne({
      where: { jiraProjectKey: key, deletedAt: undefined },
      relations: ['instance'],
    });
  }

  async findByInstanceId(instanceId: string): Promise<Project[]> {
    return this.find({
      where: { instanceId, isActive: true, deletedAt: undefined },
      order: { name: 'ASC' },
    });
  }

  async findAllActive(): Promise<Project[]> {
    return this.find({
      where: { isActive: true, deletedAt: undefined },
      relations: ['instance'],
      order: { name: 'ASC' },
    });
  }

  async findAllActivePaginated(page: number, limit: number, search?: string) {
    const qb = this.createQueryBuilder('p')
      .leftJoinAndSelect('p.instance', 'i')
      .where('p.is_active = true')
      .andWhere('p.deleted_at IS NULL');

    if (search) {
      qb.andWhere('(p.jira_project_key ILIKE :search OR p.name ILIKE :search)', { search: `%${search}%` });
    }

    const [data, total] = await qb
      .orderBy('p.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

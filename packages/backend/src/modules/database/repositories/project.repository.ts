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
}

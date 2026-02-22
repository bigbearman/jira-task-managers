import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { JiraInstance } from '../entities';

@Injectable()
export class JiraInstanceRepository extends Repository<JiraInstance> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(JiraInstance, dataSource.createEntityManager());
  }

  async findBySlug(slug: string): Promise<JiraInstance | null> {
    return this.findOne({ where: { slug, deletedAt: undefined }, relations: ['projects'] });
  }

  async findAllActive(): Promise<JiraInstance[]> {
    return this.find({
      where: { isActive: true, deletedAt: undefined },
      order: { name: 'ASC' },
    });
  }

  async findSyncEnabled(): Promise<JiraInstance[]> {
    return this.find({
      where: { isActive: true, syncEnabled: true, deletedAt: undefined },
      order: { name: 'ASC' },
    });
  }
}

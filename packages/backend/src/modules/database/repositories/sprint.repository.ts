import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Sprint } from '../entities';

@Injectable()
export class SprintRepository extends Repository<Sprint> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Sprint, dataSource.createEntityManager());
  }

  async findByProjectId(jiraProjectId: string): Promise<Sprint[]> {
    return this.find({
      where: { jiraProjectId },
      order: { startDate: 'DESC' },
    });
  }

  async findActive(jiraProjectId?: string): Promise<Sprint[]> {
    const where: any = { state: 'active' };
    if (jiraProjectId) where.jiraProjectId = jiraProjectId;
    return this.find({ where, order: { startDate: 'DESC' } });
  }

  async findByJiraSprintId(jiraSprintId: number): Promise<Sprint | null> {
    return this.findOne({ where: { jiraSprintId } });
  }
}

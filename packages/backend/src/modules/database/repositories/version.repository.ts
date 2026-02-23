import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Version } from '../entities';

@Injectable()
export class VersionRepository extends Repository<Version> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Version, dataSource.createEntityManager());
  }

  async findByProjectId(jiraProjectId: string): Promise<Version[]> {
    return this.find({
      where: { jiraProjectId },
      order: { releaseDate: 'DESC' },
    });
  }

  async findUnreleased(jiraProjectId?: string): Promise<Version[]> {
    const where: any = { isReleased: false, isArchived: false };
    if (jiraProjectId) where.jiraProjectId = jiraProjectId;
    return this.find({ where, order: { name: 'ASC' } });
  }

  async findByJiraVersionId(jiraVersionId: string): Promise<Version | null> {
    return this.findOne({ where: { jiraVersionId } });
  }
}

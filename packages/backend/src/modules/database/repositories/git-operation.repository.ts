import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { GitOperation } from '../entities';

@Injectable()
export class GitOperationRepository extends Repository<GitOperation> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(GitOperation, dataSource.createEntityManager());
  }

  async findByTicketId(ticketId: string): Promise<GitOperation[]> {
    return this.find({
      where: { ticketId, deletedAt: undefined },
      order: { createdAt: 'DESC' },
    });
  }

  async findByTaskActionId(taskActionId: string): Promise<GitOperation[]> {
    return this.find({
      where: { taskActionId, deletedAt: undefined },
      order: { createdAt: 'ASC' },
    });
  }
}

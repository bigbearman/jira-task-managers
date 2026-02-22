import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { TaskAction } from '../entities';

@Injectable()
export class TaskActionRepository extends Repository<TaskAction> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(TaskAction, dataSource.createEntityManager());
  }

  async findByTicketId(ticketId: string): Promise<TaskAction[]> {
    return this.find({
      where: { ticketId, deletedAt: undefined },
      order: { createdAt: 'DESC' },
      relations: ['aiAnalyses', 'gitOperations'],
    });
  }

  async findLatestByTicketId(ticketId: string): Promise<TaskAction | null> {
    return this.findOne({
      where: { ticketId, deletedAt: undefined },
      order: { createdAt: 'DESC' },
      relations: ['aiAnalyses', 'gitOperations'],
    });
  }
}

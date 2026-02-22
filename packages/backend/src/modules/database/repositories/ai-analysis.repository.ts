import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { AiAnalysis } from '../entities';

@Injectable()
export class AiAnalysisRepository extends Repository<AiAnalysis> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(AiAnalysis, dataSource.createEntityManager());
  }

  async findByTicketId(ticketId: string): Promise<AiAnalysis[]> {
    return this.find({
      where: { ticketId, deletedAt: undefined },
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestByTicketId(ticketId: string): Promise<AiAnalysis | null> {
    return this.findOne({
      where: { ticketId, deletedAt: undefined },
      order: { createdAt: 'DESC' },
    });
  }
}

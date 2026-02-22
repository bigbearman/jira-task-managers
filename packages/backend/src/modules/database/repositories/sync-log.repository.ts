import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { SyncLog, SyncStatus } from '../entities';

@Injectable()
export class SyncLogRepository extends Repository<SyncLog> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(SyncLog, dataSource.createEntityManager());
  }

  async findRecent(limit = 10): Promise<SyncLog[]> {
    return this.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByInstanceId(instanceId: string, limit = 10): Promise<SyncLog[]> {
    return this.find({
      where: { instanceId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async createLog(data: Partial<SyncLog>): Promise<SyncLog> {
    const log = this.create({
      ...data,
      status: SyncStatus.PENDING,
    });
    return this.save(log);
  }

  async markRunning(id: string): Promise<void> {
    await this.update(id, { status: SyncStatus.RUNNING, startedAt: new Date() });
  }

  async markCompleted(id: string, stats: { processed: number; created: number; updated: number; failed: number }): Promise<void> {
    await this.update(id, {
      status: SyncStatus.COMPLETED,
      completedAt: new Date(),
      itemsProcessed: stats.processed,
      itemsCreated: stats.created,
      itemsUpdated: stats.updated,
      itemsFailed: stats.failed,
    });
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    await this.update(id, {
      status: SyncStatus.FAILED,
      completedAt: new Date(),
      errorMessage,
    });
  }
}

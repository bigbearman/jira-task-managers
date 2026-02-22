import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Notification } from '../entities';

@Injectable()
export class NotificationRepository extends Repository<Notification> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Notification, dataSource.createEntityManager());
  }

  async findUnread(recipient: string): Promise<Notification[]> {
    return this.find({
      where: { recipient, isRead: false },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(id: string): Promise<void> {
    await this.update(id, { isRead: true });
  }

  async markAllAsRead(recipient: string): Promise<void> {
    await this.update({ recipient, isRead: false }, { isRead: true });
  }
}

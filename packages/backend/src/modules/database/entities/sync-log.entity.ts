import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';

export enum SyncStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('jira_sync_logs')
export class SyncLog extends BaseEntity {
  @Index()
  @Column({ name: 'sync_type' })
  syncType: string;

  @Column({ name: 'entity_type', nullable: true })
  entityType: string | null;

  @Column({ name: 'entity_id', nullable: true })
  entityId: string | null;

  @Index()
  @Column({ name: 'jira_project_id', nullable: true })
  jiraProjectId: string | null;

  @Column({ name: 'instance_id', nullable: true })
  instanceId: string | null;

  @Column({ type: 'enum', enum: SyncStatus, default: SyncStatus.PENDING })
  status: SyncStatus;

  @Column({ name: 'items_processed', default: 0 })
  itemsProcessed: number;

  @Column({ name: 'items_created', default: 0 })
  itemsCreated: number;

  @Column({ name: 'items_updated', default: 0 })
  itemsUpdated: number;

  @Column({ name: 'items_failed', default: 0 })
  itemsFailed: number;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'triggered_by', nullable: true })
  triggeredBy: string | null;

  @ManyToOne(() => Project, (project) => project.syncLogs, { nullable: true })
  @JoinColumn({ name: 'jira_project_id', referencedColumnName: 'jiraProjectId' })
  project: Project | null;
}

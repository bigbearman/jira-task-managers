import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Ticket } from './ticket.entity';
import { TaskAction } from './task-action.entity';

export enum GitOperationType {
  BRANCH_CREATE = 'branch_create',
  CODE_APPLY = 'code_apply',
  TEST_RUN = 'test_run',
  COMMIT = 'commit',
  PUSH = 'push',
  PR_CREATE = 'pr_create',
  PR_MERGE = 'pr_merge',
}

export enum GitOperationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum CiStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
}

@Entity('git_operations')
export class GitOperation extends BaseEntity {
  @Index()
  @Column({ name: 'ticket_id' })
  ticketId: string;

  @Index()
  @Column({ name: 'task_action_id' })
  taskActionId: string;

  @Column({ name: 'operation_type', type: 'enum', enum: GitOperationType })
  operationType: GitOperationType;

  @Column({ name: 'branch_name', type: 'varchar', nullable: true })
  branchName: string | null;

  @Column({ name: 'pr_number', type: 'integer', nullable: true })
  prNumber: number | null;

  @Column({ name: 'pr_url', type: 'varchar', nullable: true })
  prUrl: string | null;

  @Column({ name: 'commit_sha', type: 'varchar', nullable: true })
  commitSha: string | null;

  @Column({ name: 'ci_status', type: 'enum', enum: CiStatus, nullable: true })
  ciStatus: CiStatus | null;

  @Column({ type: 'enum', enum: GitOperationStatus, default: GitOperationStatus.PENDING })
  status: GitOperationStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @ManyToOne(() => Ticket, (ticket) => ticket.gitOperations)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @ManyToOne(() => TaskAction, (action) => action.gitOperations)
  @JoinColumn({ name: 'task_action_id' })
  taskAction: TaskAction;
}

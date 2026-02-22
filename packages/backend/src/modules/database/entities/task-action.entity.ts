import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Ticket } from './ticket.entity';
import { AiAnalysis } from './ai-analysis.entity';
import { GitOperation } from './git-operation.entity';

export enum ActionType {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  UNREJECTED = 'unrejected',
  EDIT_APPROACH = 'edit_approach',
}

export enum ActionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('task_actions')
export class TaskAction extends BaseEntity {
  @Index()
  @Column({ name: 'ticket_id' })
  ticketId: string;

  @Column({ name: 'action_type', type: 'enum', enum: ActionType })
  actionType: ActionType;

  @Column({ type: 'enum', enum: ActionStatus, default: ActionStatus.PENDING })
  status: ActionStatus;

  @Column({ name: 'input_context', type: 'jsonb', nullable: true })
  inputContext: Record<string, any> | null;

  @Column({ name: 'output_result', type: 'jsonb', nullable: true })
  outputResult: Record<string, any> | null;

  @Column({ name: 'triggered_by', nullable: true })
  triggeredBy: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @ManyToOne(() => Ticket, (ticket) => ticket.taskActions)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @OneToMany(() => AiAnalysis, (analysis) => analysis.taskAction)
  aiAnalyses: AiAnalysis[];

  @OneToMany(() => GitOperation, (gitOp) => gitOp.taskAction)
  gitOperations: GitOperation[];
}

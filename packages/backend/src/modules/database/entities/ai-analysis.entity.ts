import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Ticket } from './ticket.entity';
import { TaskAction } from './task-action.entity';

export enum AnalysisType {
  SUMMARY = 'summary',
  SOLUTION = 'solution',
  CODE_REVIEW = 'code_review',
  TEST_GENERATION = 'test_generation',
}

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('ai_analyses')
export class AiAnalysis extends BaseEntity {
  @Index()
  @Column({ name: 'ticket_id' })
  ticketId: string;

  @Column({ name: 'task_action_id', nullable: true })
  taskActionId: string | null;

  @Column({ name: 'analysis_type', type: 'enum', enum: AnalysisType })
  analysisType: AnalysisType;

  @Column({ type: 'text', nullable: true })
  prompt: string | null;

  @Column({ type: 'text', nullable: true })
  response: string | null;

  @Column({ nullable: true })
  model: string | null;

  @Column({ name: 'tokens_used', nullable: true })
  tokensUsed: number | null;

  @Column({ name: 'cost_usd', type: 'decimal', precision: 10, scale: 6, nullable: true })
  costUsd: number | null;

  @Column({ name: 'duration_ms', nullable: true })
  durationMs: number | null;

  @Column({ type: 'enum', enum: AnalysisStatus, default: AnalysisStatus.PENDING })
  status: AnalysisStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @ManyToOne(() => Ticket, (ticket) => ticket.aiAnalyses)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @ManyToOne(() => TaskAction, (action) => action.aiAnalyses, { nullable: true })
  @JoinColumn({ name: 'task_action_id' })
  taskAction: TaskAction | null;
}

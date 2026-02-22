import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Ticket } from './ticket.entity';

@Entity('jira_worklogs')
export class Worklog extends BaseEntity {
  @Index()
  @Column({ name: 'jira_worklog_id', unique: true })
  jiraWorklogId: string;

  @Index()
  @Column({ name: 'ticket_id' })
  ticketId: string;

  @Column({ name: 'author_account_id', nullable: true })
  authorAccountId: string | null;

  @Column({ name: 'author_display_name', nullable: true })
  authorDisplayName: string | null;

  @Column({ name: 'time_spent', nullable: true })
  timeSpent: string | null;

  @Column({ name: 'time_spent_seconds', default: 0 })
  timeSpentSeconds: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'jira_created_at', type: 'timestamptz', nullable: true })
  jiraCreatedAt: Date | null;

  @Column({ name: 'jira_updated_at', type: 'timestamptz', nullable: true })
  jiraUpdatedAt: Date | null;

  @ManyToOne(() => Ticket, (ticket) => ticket.worklogs)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;
}

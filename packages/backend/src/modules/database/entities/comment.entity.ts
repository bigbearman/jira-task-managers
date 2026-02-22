import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Ticket } from './ticket.entity';

@Entity('jira_comments')
export class Comment extends BaseEntity {
  @Index()
  @Column({ name: 'jira_comment_id', unique: true })
  jiraCommentId: string;

  @Index()
  @Column({ name: 'ticket_id' })
  ticketId: string;

  @Column({ name: 'author_account_id', nullable: true })
  authorAccountId: string | null;

  @Column({ name: 'author_display_name', nullable: true })
  authorDisplayName: string | null;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ name: 'rendered_body', type: 'text', nullable: true })
  renderedBody: string | null;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @Column({ name: 'jira_created_at', type: 'timestamptz', nullable: true })
  jiraCreatedAt: Date | null;

  @Column({ name: 'jira_updated_at', type: 'timestamptz', nullable: true })
  jiraUpdatedAt: Date | null;

  @ManyToOne(() => Ticket, (ticket) => ticket.comments)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;
}

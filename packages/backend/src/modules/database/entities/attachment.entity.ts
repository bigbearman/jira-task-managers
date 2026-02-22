import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Ticket } from './ticket.entity';

@Entity('jira_attachments')
export class Attachment extends BaseEntity {
  @Index()
  @Column({ name: 'jira_attachment_id', unique: true })
  jiraAttachmentId: string;

  @Index()
  @Column({ name: 'ticket_id' })
  ticketId: string;

  @Column()
  filename: string;

  @Column({ name: 'file_size', type: 'integer', nullable: true })
  fileSize: number | null;

  @Column({ name: 'mime_type', type: 'varchar', nullable: true })
  mimeType: string | null;

  @Column({ name: 'content_url', type: 'varchar', nullable: true })
  contentUrl: string | null;

  @Column({ name: 'thumbnail_url', type: 'varchar', nullable: true })
  thumbnailUrl: string | null;

  @Column({ name: 'author_account_id', type: 'varchar', nullable: true })
  authorAccountId: string | null;

  @Column({ name: 'author_display_name', type: 'varchar', nullable: true })
  authorDisplayName: string | null;

  @Column({ name: 'jira_created_at', type: 'timestamptz', nullable: true })
  jiraCreatedAt: Date | null;

  @ManyToOne(() => Ticket, (ticket) => ticket.attachments)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;
}

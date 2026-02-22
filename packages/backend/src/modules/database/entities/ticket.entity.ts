import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { Sprint } from './sprint.entity';
import { Version } from './version.entity';
import { Comment } from './comment.entity';
import { Worklog } from './worklog.entity';
import { Attachment } from './attachment.entity';
import { TaskAction } from './task-action.entity';
import { AiAnalysis } from './ai-analysis.entity';
import { GitOperation } from './git-operation.entity';

@Entity('jira_tickets')
export class Ticket extends BaseEntity {
  @Index()
  @Column({ name: 'jira_ticket_id', unique: true })
  jiraTicketId: string;

  @Index({ unique: true })
  @Column({ name: 'jira_ticket_key' })
  jiraTicketKey: string;

  @Index()
  @Column({ name: 'jira_project_id' })
  jiraProjectId: string;

  @Column()
  summary: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'issue_type', nullable: true })
  issueType: string | null;

  @Column({ nullable: true })
  status: string | null;

  @Column({ nullable: true })
  priority: string | null;

  @Column({ name: 'assignee_account_id', nullable: true })
  assigneeAccountId: string | null;

  @Column({ name: 'assignee_display_name', nullable: true })
  assigneeDisplayName: string | null;

  @Column({ name: 'reporter_account_id', nullable: true })
  reporterAccountId: string | null;

  @Column({ name: 'reporter_display_name', nullable: true })
  reporterDisplayName: string | null;

  @Column({ name: 'creator_account_id', nullable: true })
  creatorAccountId: string | null;

  @Column({ name: 'creator_display_name', nullable: true })
  creatorDisplayName: string | null;

  @Column({ name: 'story_points', type: 'decimal', precision: 5, scale: 2, nullable: true })
  storyPoints: number | null;

  @Column({ name: 'original_estimate_seconds', nullable: true })
  originalEstimateSeconds: number | null;

  @Column({ name: 'time_spent_seconds', nullable: true })
  timeSpentSeconds: number | null;

  @Column({ name: 'remaining_estimate_seconds', nullable: true })
  remainingEstimateSeconds: number | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date | null;

  @Column({ nullable: true })
  resolution: string | null;

  @Column({ name: 'resolution_date', type: 'timestamptz', nullable: true })
  resolutionDate: Date | null;

  @Column({ type: 'simple-array', nullable: true })
  labels: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  components: string[] | null;

  @Column({ name: 'parent_key', nullable: true })
  parentKey: string | null;

  @Column({ name: 'epic_key', nullable: true })
  epicKey: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'jira_created_at', type: 'timestamptz', nullable: true })
  jiraCreatedAt: Date | null;

  @Column({ name: 'jira_updated_at', type: 'timestamptz', nullable: true })
  jiraUpdatedAt: Date | null;

  @ManyToOne(() => Project, (project) => project.tickets)
  @JoinColumn({ name: 'jira_project_id', referencedColumnName: 'jiraProjectId' })
  project: Project;

  @ManyToMany(() => Sprint, (sprint) => sprint.tickets)
  sprints: Sprint[];

  @ManyToMany(() => Version, (version) => version.fixTickets)
  fixVersions: Version[];

  @OneToMany(() => Comment, (comment) => comment.ticket)
  comments: Comment[];

  @OneToMany(() => Worklog, (worklog) => worklog.ticket)
  worklogs: Worklog[];

  @OneToMany(() => Attachment, (attachment) => attachment.ticket)
  attachments: Attachment[];

  @OneToMany(() => TaskAction, (action) => action.ticket)
  taskActions: TaskAction[];

  @OneToMany(() => AiAnalysis, (analysis) => analysis.ticket)
  aiAnalyses: AiAnalysis[];

  @OneToMany(() => GitOperation, (gitOp) => gitOp.ticket)
  gitOperations: GitOperation[];

  @ManyToOne(() => Ticket, { nullable: true })
  @JoinColumn({ name: 'parent_key', referencedColumnName: 'jiraTicketKey' })
  parent: Ticket | null;

  @OneToMany(() => Ticket, (ticket) => ticket.parent)
  subtasks: Ticket[];
}

import { Entity, Column, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { JiraInstance } from './jira-instance.entity';
import { Sprint } from './sprint.entity';
import { Version } from './version.entity';
import { Ticket } from './ticket.entity';
import { SyncLog } from './sync-log.entity';

@Entity('jira_projects')
export class Project extends BaseEntity {
  @Index()
  @Column({ name: 'instance_id' })
  instanceId: string;

  @Index({ unique: true })
  @Column({ name: 'jira_project_id' })
  jiraProjectId: string;

  @Index({ unique: true })
  @Column({ name: 'jira_project_key' })
  jiraProjectKey: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'project_type', nullable: true })
  projectType: string | null;

  @Column({ name: 'lead_account_id', nullable: true })
  leadAccountId: string | null;

  @Column({ name: 'lead_display_name', nullable: true })
  leadDisplayName: string | null;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ManyToOne(() => JiraInstance, (instance) => instance.projects)
  @JoinColumn({ name: 'instance_id' })
  instance: JiraInstance;

  @OneToMany(() => Sprint, (sprint) => sprint.project)
  sprints: Sprint[];

  @OneToMany(() => Version, (version) => version.project)
  versions: Version[];

  @OneToMany(() => Ticket, (ticket) => ticket.project)
  tickets: Ticket[];

  @OneToMany(() => SyncLog, (syncLog) => syncLog.project)
  syncLogs: SyncLog[];
}

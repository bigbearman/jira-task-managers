import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';

@Entity('jira_instances')
export class JiraInstance extends BaseEntity {
  @Column()
  name: string;

  @Index({ unique: true })
  @Column({ unique: true })
  slug: string;

  @Column({ name: 'base_url' })
  baseUrl: string;

  @Column()
  email: string;

  @Column({ name: 'api_token' })
  apiToken: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sync_enabled', default: true })
  syncEnabled: boolean;

  @Column({ type: 'simple-array', nullable: true })
  assignees: string[] | null;

  @Column({ name: 'project_keys', type: 'simple-array', nullable: true })
  projectKeys: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any> | null;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @OneToMany(() => Project, (project) => project.instance)
  projects: Project[];
}

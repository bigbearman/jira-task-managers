import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { Ticket } from './ticket.entity';

@Entity('jira_versions')
export class Version extends BaseEntity {
  @Index()
  @Column({ name: 'jira_version_id', unique: true })
  jiraVersionId: string;

  @Index()
  @Column({ name: 'jira_project_id' })
  jiraProjectId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_released', default: false })
  isReleased: boolean;

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @Column({ name: 'release_date', type: 'date', nullable: true })
  releaseDate: Date | null;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date | null;

  @ManyToOne(() => Project, (project) => project.versions)
  @JoinColumn({ name: 'jira_project_id', referencedColumnName: 'jiraProjectId' })
  project: Project;

  @ManyToMany(() => Ticket, (ticket) => ticket.fixVersions)
  @JoinTable({
    name: 'jira_ticket_version',
    joinColumn: { name: 'version_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'ticket_id', referencedColumnName: 'id' },
  })
  fixTickets: Ticket[];
}

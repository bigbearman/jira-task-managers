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

@Entity('jira_sprints')
export class Sprint extends BaseEntity {
  @Index()
  @Column({ name: 'jira_sprint_id', unique: true })
  jiraSprintId: number;

  @Index()
  @Column({ name: 'jira_project_id' })
  jiraProjectId: string;

  @Column()
  name: string;

  @Column({ default: 'future' })
  state: string;

  @Column({ name: 'start_date', type: 'timestamptz', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ name: 'complete_date', type: 'timestamptz', nullable: true })
  completeDate: Date | null;

  @Column({ type: 'text', nullable: true })
  goal: string | null;

  @Column({ name: 'board_id', nullable: true })
  boardId: number | null;

  @ManyToOne(() => Project, (project) => project.sprints)
  @JoinColumn({ name: 'jira_project_id', referencedColumnName: 'jiraProjectId' })
  project: Project;

  @ManyToMany(() => Ticket, (ticket) => ticket.sprints)
  @JoinTable({
    name: 'jira_ticket_sprint',
    joinColumn: { name: 'sprint_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'ticket_id', referencedColumnName: 'id' },
  })
  tickets: Ticket[];
}

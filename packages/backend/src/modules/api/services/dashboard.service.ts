import { Injectable } from '@nestjs/common';
import {
  ProjectRepository,
  SprintRepository,
  TaskActionRepository,
  AiAnalysisRepository,
} from '@/database';

@Injectable()
export class DashboardService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly sprintRepo: SprintRepository,
    private readonly taskActionRepo: TaskActionRepository,
    private readonly aiAnalysisRepo: AiAnalysisRepository,
  ) {}

  async getOverview() {
    const projects = await this.projectRepo.findAllActive();

    const ticketStats = await this.projectRepo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'total')
      .addSelect(`COUNT(*) FILTER (WHERE status IN ('Done', 'Closed', 'Resolved'))`, 'done')
      .addSelect(`COUNT(*) FILTER (WHERE status IN ('In Progress', 'Development'))`, 'inProgress')
      .addSelect(`COUNT(*) FILTER (WHERE status IN ('To Do', 'Open', 'New', 'Backlog'))`, 'todo')
      .from('jira_tickets', 't')
      .where('t.deleted_at IS NULL')
      .getRawOne();

    const activeSprints = await this.sprintRepo.findActive();

    const recentActions = await this.taskActionRepo.find({
      order: { createdAt: 'DESC' },
      take: 10,
      relations: ['ticket'],
    });

    return {
      projects: projects.map((p) => ({
        id: p.id,
        key: p.jiraProjectKey,
        name: p.name,
      })),
      tickets: {
        total: Number(ticketStats.total),
        done: Number(ticketStats.done),
        inProgress: Number(ticketStats.inProgress),
        todo: Number(ticketStats.todo),
      },
      activeSprints,
      recentActions,
    };
  }

  async getSprintVelocity(projectKey?: string) {
    const qb = this.sprintRepo.manager
      .createQueryBuilder()
      .select('s.id', 'sprintId')
      .addSelect('s.name', 'sprintName')
      .addSelect('s.state', 'state')
      .addSelect('s.start_date', 'startDate')
      .addSelect('s.end_date', 'endDate')
      .addSelect('COUNT(t.id)', 'totalTickets')
      .addSelect(`COUNT(t.id) FILTER (WHERE t.status IN ('Done', 'Closed', 'Resolved'))`, 'completedTickets')
      .addSelect('COALESCE(SUM(t.story_points), 0)', 'totalPoints')
      .addSelect(`COALESCE(SUM(t.story_points) FILTER (WHERE t.status IN ('Done', 'Closed', 'Resolved')), 0)`, 'completedPoints')
      .from('jira_sprints', 's')
      .leftJoin('jira_ticket_sprint', 'ts', 'ts.sprint_id = s.id')
      .leftJoin('jira_tickets', 't', 't.id = ts.ticket_id AND t.deleted_at IS NULL')
      .where('s.deleted_at IS NULL')
      .groupBy('s.id')
      .addGroupBy('s.name')
      .addGroupBy('s.state')
      .addGroupBy('s.start_date')
      .addGroupBy('s.end_date')
      .orderBy('s.start_date', 'DESC')
      .limit(10);

    if (projectKey) {
      qb.andWhere('s.jira_project_id = (SELECT jira_project_id FROM jira_projects WHERE jira_project_key = :key AND deleted_at IS NULL)', { key: projectKey });
    }

    return qb.getRawMany();
  }

  async getAiStats() {
    const stats = await this.aiAnalysisRepo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'totalAnalyses')
      .addSelect(`COUNT(*) FILTER (WHERE a.status = 'completed')`, 'completed')
      .addSelect(`COUNT(*) FILTER (WHERE a.status = 'failed')`, 'failed')
      .addSelect('COALESCE(SUM(a.tokens_used), 0)', 'totalTokens')
      .addSelect('COALESCE(SUM(a.cost_usd), 0)', 'totalCostUsd')
      .addSelect('COALESCE(AVG(a.duration_ms), 0)', 'avgDurationMs')
      .from('ai_analyses', 'a')
      .where('a.deleted_at IS NULL')
      .getRawOne();

    const recentAnalyses = await this.aiAnalysisRepo.find({
      order: { createdAt: 'DESC' },
      take: 10,
      relations: ['ticket'],
    });

    return {
      totalAnalyses: Number(stats.totalAnalyses),
      completed: Number(stats.completed),
      failed: Number(stats.failed),
      totalTokens: Number(stats.totalTokens),
      totalCostUsd: parseFloat(stats.totalCostUsd),
      avgDurationMs: Math.round(Number(stats.avgDurationMs)),
      recentAnalyses,
    };
  }
}

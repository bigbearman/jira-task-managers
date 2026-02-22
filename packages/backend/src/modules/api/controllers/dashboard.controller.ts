import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Dashboard overview (projects, ticket stats, active sprints, recent actions)' })
  async getOverview() {
    const data = await this.dashboardService.getOverview();
    return { success: true, data };
  }

  @Get('sprint-velocity')
  @ApiOperation({ summary: 'Sprint velocity metrics' })
  async getSprintVelocity(@Query('projectKey') projectKey?: string) {
    const data = await this.dashboardService.getSprintVelocity(projectKey);
    return { success: true, data };
  }

  @Get('ai-stats')
  @ApiOperation({ summary: 'AI usage stats (analyses count, tokens, cost)' })
  async getAiStats() {
    const data = await this.dashboardService.getAiStats();
    return { success: true, data };
  }
}

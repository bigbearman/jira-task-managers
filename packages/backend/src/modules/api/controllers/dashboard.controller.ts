import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { DashboardService } from '../services/dashboard.service';
import { CACHE_TTL } from '@/shared/constants/cache';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseInterceptors(CacheInterceptor)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @CacheTTL(CACHE_TTL.DASHBOARD * 1000)
  @ApiOperation({ summary: 'Dashboard overview (projects, ticket stats, active sprints, recent actions)' })
  async getOverview() {
    const data = await this.dashboardService.getOverview();
    return { success: true, data };
  }

  @Get('sprint-velocity')
  @CacheTTL(CACHE_TTL.LIST * 1000)
  @ApiOperation({ summary: 'Sprint velocity metrics' })
  async getSprintVelocity(@Query('projectKey') projectKey?: string) {
    const data = await this.dashboardService.getSprintVelocity(projectKey);
    return { success: true, data };
  }

  @Get('ai-stats')
  @CacheTTL(CACHE_TTL.LIST * 1000)
  @ApiOperation({ summary: 'AI usage stats (analyses count, tokens, cost)' })
  async getAiStats() {
    const data = await this.dashboardService.getAiStats();
    return { success: true, data };
  }
}

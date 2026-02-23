import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Throttle } from '@nestjs/throttler';
import { SprintService } from '../services/sprint.service';
import { PaginationDto } from '../dtos';
import { CACHE_TTL } from '@/shared/constants/cache';

@ApiTags('Sprints')
@Controller()
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Get('projects/:key/sprints')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CACHE_TTL.LIST * 1000)
  @ApiOperation({ summary: 'List sprints for a project' })
  async listByProject(@Param('key') key: string) {
    const sprints = await this.sprintService.findByProject(key);
    return { success: true, data: sprints };
  }

  @Get('sprints/active')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CACHE_TTL.DETAIL * 1000)
  @ApiOperation({ summary: 'Get active sprints (optionally filtered by project)' })
  async getActive(@Query('projectKey') projectKey?: string) {
    const sprints = await this.sprintService.findActive(projectKey);
    return { success: true, data: sprints };
  }

  @Get('sprints/:id')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CACHE_TTL.DETAIL * 1000)
  @ApiOperation({ summary: 'Get sprint by ID' })
  async getById(@Param('id') id: string) {
    const sprint = await this.sprintService.findById(id);
    return { success: true, data: sprint };
  }

  @Get('sprints/:id/tickets')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Get tickets in a sprint' })
  async getTickets(@Param('id') id: string, @Query() dto: PaginationDto) {
    const result = await this.sprintService.getTickets(id, dto.page, dto.limit);
    return { success: true, ...result };
  }

  @Get('sprints/:id/stats')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CACHE_TTL.DASHBOARD * 1000)
  @ApiOperation({ summary: 'Get sprint stats (ticket counts by status)' })
  async getStats(@Param('id') id: string) {
    const stats = await this.sprintService.getSprintStats(id);
    return { success: true, data: stats };
  }
}

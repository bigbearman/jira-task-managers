import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Throttle } from '@nestjs/throttler';
import { ProjectService } from '../services/project.service';
import { PaginationDto } from '../dtos/pagination.dto';
import { CACHE_TTL } from '@/shared/constants/cache';

@ApiTags('Projects')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CACHE_TTL.LIST * 1000)
  @ApiOperation({ summary: 'List all projects across all instances' })
  async list(@Query() query: PaginationDto, @Query('search') search?: string) {
    const result = await this.projectService.findAll(query.page, query.limit, search);
    return { success: true, data: result.data, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } };
  }

  @Get(':key')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CACHE_TTL.DETAIL * 1000)
  @ApiOperation({ summary: 'Get project by key' })
  async getByKey(@Param('key') key: string) {
    const project = await this.projectService.findByKey(key);
    return { success: true, data: project };
  }

  @Get(':key/stats')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CACHE_TTL.DASHBOARD * 1000)
  @ApiOperation({ summary: 'Get project stats (ticket/sprint/version counts)' })
  async getStats(@Param('key') key: string) {
    const stats = await this.projectService.getStats(key);
    return { success: true, data: stats };
  }
}

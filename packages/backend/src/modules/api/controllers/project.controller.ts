import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProjectService } from '../services/project.service';

@ApiTags('Projects')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: 'List all projects across all instances' })
  async list() {
    const projects = await this.projectService.findAll();
    return { success: true, data: projects };
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get project by key' })
  async getByKey(@Param('key') key: string) {
    const project = await this.projectService.findByKey(key);
    return { success: true, data: project };
  }

  @Get(':key/stats')
  @ApiOperation({ summary: 'Get project stats (ticket/sprint/version counts)' })
  async getStats(@Param('key') key: string) {
    const stats = await this.projectService.getStats(key);
    return { success: true, data: stats };
  }
}

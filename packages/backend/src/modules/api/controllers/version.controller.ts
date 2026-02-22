import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VersionService } from '../services/version.service';
import { PaginationDto } from '../dtos';

@ApiTags('Versions')
@Controller()
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  @Get('projects/:key/versions')
  @ApiOperation({ summary: 'List versions for a project' })
  async listByProject(@Param('key') key: string) {
    const versions = await this.versionService.findByProject(key);
    return { success: true, data: versions };
  }

  @Get('versions/unreleased')
  @ApiOperation({ summary: 'Get unreleased versions (optionally filtered by project)' })
  async getUnreleased(@Query('projectKey') projectKey?: string) {
    const versions = await this.versionService.findUnreleased(projectKey);
    return { success: true, data: versions };
  }

  @Get('versions/:id')
  @ApiOperation({ summary: 'Get version by ID' })
  async getById(@Param('id') id: string) {
    const version = await this.versionService.findById(id);
    return { success: true, data: version };
  }

  @Get('versions/:id/tickets')
  @ApiOperation({ summary: 'Get tickets in a version' })
  async getTickets(@Param('id') id: string, @Query() dto: PaginationDto) {
    const result = await this.versionService.getTickets(id, dto.page, dto.limit);
    return { success: true, ...result };
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JiraInstanceRepository } from '@/database';
import { JiraService } from '@/jira/jira.service';
import { CreateInstanceDto, UpdateInstanceDto } from '../dtos';

@ApiTags('Jira Instances')
@Controller('instances')
export class InstanceController {
  constructor(
    private readonly instanceRepo: JiraInstanceRepository,
    private readonly jiraService: JiraService,
  ) {}

  @Get()
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'List all Jira instances' })
  async list() {
    const instances = await this.instanceRepo.findAllActive();
    return { success: true, data: instances };
  }

  @Get(':slug')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Get instance by slug' })
  async getBySlug(@Param('slug') slug: string) {
    const instance = await this.instanceRepo.findBySlug(slug);
    if (!instance) throw new NotFoundException(`Instance '${slug}' not found`);
    return { success: true, data: instance };
  }

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Create new Jira instance' })
  async create(@Body() dto: CreateInstanceDto) {
    const instance = this.instanceRepo.create({
      name: dto.name,
      slug: dto.slug,
      baseUrl: dto.baseUrl.replace(/\/$/, ''),
      email: dto.email,
      apiToken: dto.apiToken,
      syncEnabled: dto.syncEnabled ?? true,
      assignees: dto.assignees ?? null,
      projectKeys: dto.projectKeys ?? null,
    });
    const saved = await this.instanceRepo.save(instance);
    return { success: true, data: saved };
  }

  @Put(':slug')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Update instance' })
  async update(@Param('slug') slug: string, @Body() dto: UpdateInstanceDto) {
    const instance = await this.instanceRepo.findBySlug(slug);
    if (!instance) throw new NotFoundException(`Instance '${slug}' not found`);

    const updateData: Record<string, any> = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.baseUrl) updateData.baseUrl = dto.baseUrl.replace(/\/$/, '');
    if (dto.email) updateData.email = dto.email;
    if (dto.apiToken) updateData.apiToken = dto.apiToken;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.syncEnabled !== undefined) updateData.syncEnabled = dto.syncEnabled;
    if (dto.assignees !== undefined) updateData.assignees = dto.assignees;
    if (dto.projectKeys !== undefined) updateData.projectKeys = dto.projectKeys;

    await this.instanceRepo.update(instance.id, updateData);
    const updated = await this.instanceRepo.findBySlug(slug);
    return { success: true, data: updated };
  }

  @Delete(':slug')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate instance (soft delete)' })
  async deactivate(@Param('slug') slug: string) {
    const instance = await this.instanceRepo.findBySlug(slug);
    if (!instance) throw new NotFoundException(`Instance '${slug}' not found`);
    await this.instanceRepo.update(instance.id, { isActive: false });
    return { success: true, message: 'Instance deactivated' };
  }

  @Post(':slug/test')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Test Jira connection' })
  async testConnection(@Param('slug') slug: string) {
    const instance = await this.instanceRepo.findBySlug(slug);
    if (!instance) throw new NotFoundException(`Instance '${slug}' not found`);

    const result = await this.jiraService.testConnection({
      baseUrl: instance.baseUrl,
      email: instance.email,
      apiToken: instance.apiToken,
    });
    return { success: result.success, data: result };
  }
}

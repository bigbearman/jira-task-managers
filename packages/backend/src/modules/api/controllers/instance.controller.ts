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
import { JiraInstanceRepository } from '@/database';
import { JiraService } from '@/jira/jira.service';
import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';

class CreateInstanceDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsUrl()
  baseUrl: string;

  @IsString()
  email: string;

  @IsString()
  apiToken: string;

  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;
}

class UpdateInstanceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  baseUrl?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  apiToken?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;
}

@ApiTags('Jira Instances')
@Controller('instances')
export class InstanceController {
  constructor(
    private readonly instanceRepo: JiraInstanceRepository,
    private readonly jiraService: JiraService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all Jira instances' })
  async list() {
    const instances = await this.instanceRepo.findAllActive();
    return { success: true, data: instances };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get instance by slug' })
  async getBySlug(@Param('slug') slug: string) {
    const instance = await this.instanceRepo.findBySlug(slug);
    if (!instance) throw new NotFoundException(`Instance '${slug}' not found`);
    return { success: true, data: instance };
  }

  @Post()
  @ApiOperation({ summary: 'Create new Jira instance' })
  async create(@Body() dto: CreateInstanceDto) {
    const instance = this.instanceRepo.create({
      name: dto.name,
      slug: dto.slug,
      baseUrl: dto.baseUrl.replace(/\/$/, ''),
      email: dto.email,
      apiToken: dto.apiToken,
      syncEnabled: dto.syncEnabled ?? true,
    });
    const saved = await this.instanceRepo.save(instance);
    return { success: true, data: saved };
  }

  @Put(':slug')
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

    await this.instanceRepo.update(instance.id, updateData);
    const updated = await this.instanceRepo.findBySlug(slug);
    return { success: true, data: updated };
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate instance (soft delete)' })
  async deactivate(@Param('slug') slug: string) {
    const instance = await this.instanceRepo.findBySlug(slug);
    if (!instance) throw new NotFoundException(`Instance '${slug}' not found`);
    await this.instanceRepo.update(instance.id, { isActive: false });
    return { success: true, message: 'Instance deactivated' };
  }

  @Post(':slug/test')
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

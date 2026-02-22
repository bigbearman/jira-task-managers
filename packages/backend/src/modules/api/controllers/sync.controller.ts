import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { JiraInstanceRepository, SyncLogRepository } from '@/database';
import { QueueService } from '@/queue/queue.service';

class TriggerSyncDto {
  @IsOptional()
  @IsString()
  instanceSlug?: string;

  @IsOptional()
  @IsString()
  triggeredBy?: string;
}

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(
    private readonly instanceRepo: JiraInstanceRepository,
    private readonly syncLogRepo: SyncLogRepository,
    private readonly queueService: QueueService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Trigger full sync for all instances or specific instance' })
  async triggerSync(@Body() dto: TriggerSyncDto) {
    if (dto.instanceSlug) {
      const instance = await this.instanceRepo.findBySlug(dto.instanceSlug);
      if (!instance) return { success: false, message: `Instance '${dto.instanceSlug}' not found` };
      await this.queueService.addSyncAllJob(instance.id, dto.triggeredBy || 'api');
      return { success: true, message: `Sync queued for ${instance.name}` };
    }

    const instances = await this.instanceRepo.findSyncEnabled();
    for (const instance of instances) {
      await this.queueService.addSyncAllJob(instance.id, dto.triggeredBy || 'api');
    }
    return { success: true, message: `Sync queued for ${instances.length} instances` };
  }

  @Post('projects')
  @ApiOperation({ summary: 'Sync projects only' })
  async syncProjects(@Body() dto: TriggerSyncDto) {
    if (dto.instanceSlug) {
      const instance = await this.instanceRepo.findBySlug(dto.instanceSlug);
      if (!instance) return { success: false, message: 'Instance not found' };
      await this.queueService.addSyncProjectsJob(instance.id);
      return { success: true, message: `Projects sync queued for ${instance.name}` };
    }

    const instances = await this.instanceRepo.findSyncEnabled();
    for (const instance of instances) {
      await this.queueService.addSyncProjectsJob(instance.id);
    }
    return { success: true, message: `Projects sync queued for ${instances.length} instances` };
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get recent sync logs' })
  async getLogs(@Query('limit') limit?: number, @Query('instanceSlug') instanceSlug?: string) {
    if (instanceSlug) {
      const instance = await this.instanceRepo.findBySlug(instanceSlug);
      if (instance) {
        const logs = await this.syncLogRepo.findByInstanceId(instance.id, limit || 10);
        return { success: true, data: logs };
      }
    }
    const logs = await this.syncLogRepo.findRecent(limit || 10);
    return { success: true, data: logs };
  }
}

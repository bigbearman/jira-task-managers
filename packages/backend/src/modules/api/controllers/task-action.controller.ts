import { Controller, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TaskActionService } from '../services/task-action.service';
import { AnalyzeTicketDto, ApproveTicketDto, EditApproachDto } from '../dtos';

@ApiTags('Task Actions')
@Controller('tickets')
export class TaskActionController {
  constructor(private readonly taskActionService: TaskActionService) {}

  @Post(':key/analyze')
  @ApiOperation({ summary: 'Trigger AI analysis (Claude summary + solution)' })
  async analyze(@Param('key') key: string, @Body() dto: AnalyzeTicketDto) {
    const action = await this.taskActionService.analyze(key, dto);
    return { success: true, data: action, message: 'Analysis queued' };
  }

  @Post(':key/approve')
  @ApiOperation({ summary: 'Approve ticket → trigger code flow (branch → code → test → PR)' })
  async approve(@Param('key') key: string, @Body() dto: ApproveTicketDto) {
    const action = await this.taskActionService.approve(key, dto);
    return { success: true, data: action, message: 'Approve flow queued' };
  }

  @Post(':key/reject')
  @ApiOperation({ summary: 'Reject ticket (pause task)' })
  async reject(
    @Param('key') key: string,
    @Body('triggeredBy') triggeredBy?: string,
  ) {
    const action = await this.taskActionService.reject(key, triggeredBy);
    return { success: true, data: action };
  }

  @Post(':key/unreject')
  @ApiOperation({ summary: 'Unreject ticket (re-enable)' })
  async unreject(
    @Param('key') key: string,
    @Body('triggeredBy') triggeredBy?: string,
  ) {
    const action = await this.taskActionService.unreject(key, triggeredBy);
    return { success: true, data: action };
  }

  @Put(':key/approach')
  @ApiOperation({ summary: 'Edit approach (input/output context)' })
  async editApproach(@Param('key') key: string, @Body() dto: EditApproachDto) {
    const action = await this.taskActionService.editApproach(key, dto);
    return { success: true, data: action };
  }
}

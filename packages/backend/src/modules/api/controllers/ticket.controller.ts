import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TicketService } from '../services/ticket.service';
import { ListTicketsDto } from '../dtos';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'List tickets with filters (project, sprint, version, status, assignee)' })
  async list(@Query() dto: ListTicketsDto) {
    const result = await this.ticketService.findWithFilters(dto);
    return { success: true, ...result };
  }

  @Get(':key')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Get ticket detail by key (e.g., PROJ-123)' })
  async getByKey(@Param('key') key: string) {
    const ticket = await this.ticketService.findByKey(key);
    return { success: true, data: ticket };
  }

  @Get(':key/comments')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Get comments for a ticket' })
  async getComments(@Param('key') key: string) {
    const comments = await this.ticketService.getComments(key);
    return { success: true, data: comments };
  }

  @Get(':key/worklogs')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Get worklogs for a ticket' })
  async getWorklogs(@Param('key') key: string) {
    const worklogs = await this.ticketService.getWorklogs(key);
    return { success: true, data: worklogs };
  }

  @Get(':key/ai-analysis')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Get latest AI analysis for a ticket' })
  async getAiAnalysis(@Param('key') key: string) {
    const analysis = await this.ticketService.getAiAnalysis(key);
    return { success: true, data: analysis };
  }

  @Get(':key/git-status')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Get git operations (branch, PR, CI) for a ticket' })
  async getGitStatus(@Param('key') key: string) {
    const ops = await this.ticketService.getGitStatus(key);
    return { success: true, data: ops };
  }

  @Get(':key/actions')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Get action history for a ticket' })
  async getActions(@Param('key') key: string) {
    const actions = await this.ticketService.getActions(key);
    return { success: true, data: actions };
  }
}

import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';

export class ListTicketsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by project key (e.g., PROJ)' })
  @IsOptional()
  @IsString()
  projectKey?: string;

  @ApiPropertyOptional({ description: 'Filter by sprint ID' })
  @IsOptional()
  @IsString()
  sprintId?: string;

  @ApiPropertyOptional({ description: 'Filter by version ID' })
  @IsOptional()
  @IsString()
  versionId?: string;

  @ApiPropertyOptional({ description: 'Filter by status (e.g., "In Progress")' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by assignee name' })
  @IsOptional()
  @IsString()
  assignee?: string;

  @ApiPropertyOptional({ description: 'Filter by issue type (e.g., Bug, Story, Task)' })
  @IsOptional()
  @IsString()
  issueType?: string;

  @ApiPropertyOptional({ description: 'Filter by Jira instance slug' })
  @IsOptional()
  @IsString()
  instanceSlug?: string;
}

export class AnalyzeTicketDto {
  @ApiPropertyOptional({ description: 'Custom prompt/context for Claude analysis' })
  @IsOptional()
  @IsString()
  customPrompt?: string;

  @ApiPropertyOptional({ description: 'Who triggered this action' })
  @IsOptional()
  @IsString()
  triggeredBy?: string;
}

export class ApproveTicketDto {
  @ApiPropertyOptional({ description: 'Approach/instructions for code changes' })
  @IsOptional()
  @IsString()
  approach?: string;

  @ApiPropertyOptional({ description: 'Target project path for code changes' })
  @IsOptional()
  @IsString()
  projectPath?: string;

  @ApiPropertyOptional({ description: 'Target branch for PR (default: develop)' })
  @IsOptional()
  @IsString()
  targetBranch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  triggeredBy?: string;
}

export class EditApproachDto {
  @IsString()
  approach: string;

  @ApiPropertyOptional({ description: 'Expected input context' })
  @IsOptional()
  @IsString()
  inputContext?: string;

  @ApiPropertyOptional({ description: 'Expected output/deliverable' })
  @IsOptional()
  @IsString()
  expectedOutput?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  triggeredBy?: string;
}

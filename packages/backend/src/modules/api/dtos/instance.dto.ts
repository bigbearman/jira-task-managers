import { IsString, IsOptional, IsBoolean, IsUrl, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInstanceDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignees?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  projectKeys?: string[];
}

export class UpdateInstanceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  baseUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignees?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  projectKeys?: string[];
}

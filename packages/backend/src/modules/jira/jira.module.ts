import { Module } from '@nestjs/common';
import { JiraService } from './jira.service';
import { JiraAgileService } from './jira-agile.service';

@Module({
  providers: [JiraService, JiraAgileService],
  exports: [JiraService, JiraAgileService],
})
export class JiraModule {}

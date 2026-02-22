import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { JiraCredentials, JiraBoard, JiraSprint, JiraIssue } from './jira.types';
import { JiraService } from './jira.service';

@Injectable()
export class JiraAgileService {
  private readonly logger = new Logger(JiraAgileService.name);

  constructor(private readonly jiraService: JiraService) {}

  private createClient(creds: JiraCredentials) {
    return axios.create({
      baseURL: creds.baseUrl,
      auth: { username: creds.email, password: creds.apiToken },
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      timeout: 30000,
    });
  }

  async getBoards(creds: JiraCredentials): Promise<JiraBoard[]> {
    const client = this.createClient(creds);
    try {
      const { data } = await client.get('/rest/agile/1.0/board', {
        params: { maxResults: 100 },
      });
      return data.values || [];
    } catch (error: any) {
      this.logger.error(`getBoards failed: ${error.message}`);
      throw error;
    }
  }

  async getSprints(
    creds: JiraCredentials,
    boardId: number,
    startAt = 0,
    maxResults = 50,
    state?: string,
  ): Promise<{ values: JiraSprint[]; total: number }> {
    const client = this.createClient(creds);
    try {
      const params: Record<string, any> = { startAt, maxResults };
      if (state) params.state = state;

      const { data } = await client.get(`/rest/agile/1.0/board/${boardId}/sprint`, { params });
      return data;
    } catch (error: any) {
      this.logger.error(`getSprints(board=${boardId}) failed: ${error.message}`);
      throw error;
    }
  }

  async getSprint(creds: JiraCredentials, sprintId: number): Promise<JiraSprint> {
    const client = this.createClient(creds);
    try {
      const { data } = await client.get<JiraSprint>(`/rest/agile/1.0/sprint/${sprintId}`);
      return data;
    } catch (error: any) {
      this.logger.error(`getSprint(${sprintId}) failed: ${error.message}`);
      throw error;
    }
  }

  async getSprintIssues(
    creds: JiraCredentials,
    sprintId: number,
    startAt = 0,
    maxResults = 100,
    jql?: string,
  ): Promise<{ issues: JiraIssue[]; total: number }> {
    const client = this.createClient(creds);
    try {
      const params: Record<string, any> = { startAt, maxResults, fields: '*all' };
      if (jql) params.jql = jql;

      const { data } = await client.get(`/rest/agile/1.0/sprint/${sprintId}/issue`, { params });
      return data;
    } catch (error: any) {
      this.logger.error(`getSprintIssues(${sprintId}) failed: ${error.message}`);
      throw error;
    }
  }

  async getAllSprintsForBoard(creds: JiraCredentials, boardId: number): Promise<JiraSprint[]> {
    return this.jiraService.fetchAllPages<JiraSprint>(
      (startAt, maxResults) => this.getSprints(creds, boardId, startAt, maxResults),
    );
  }

  async getAllSprintIssues(creds: JiraCredentials, sprintId: number): Promise<JiraIssue[]> {
    return this.jiraService.fetchAllPages<JiraIssue>(
      (startAt, maxResults) => this.getSprintIssues(creds, sprintId, startAt, maxResults),
    );
  }
}

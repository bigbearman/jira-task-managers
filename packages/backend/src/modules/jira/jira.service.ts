import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  JiraCredentials,
  JiraSearchResponse,
  JiraIssue,
  JiraProject,
  JiraComment,
  JiraWorklog,
  JiraTransition,
  JiraVersion,
} from './jira.types';

@Injectable()
export class JiraService {
  private readonly logger = new Logger(JiraService.name);
  private readonly rateLimitMs: number;
  private readonly defaultFields = [
    'summary', 'status', 'assignee', 'priority', 'issuetype', 'reporter', 'creator',
    'resolution', 'resolutiondate', 'labels', 'components', 'parent',
    'timeoriginalestimate', 'timeestimate', 'timespent', 'duedate',
    'created', 'updated', 'description', 'customfield_10016', 'fixVersions', 'versions',
  ];

  constructor(private readonly configService: ConfigService) {
    this.rateLimitMs = this.configService.get<number>('jira.sync.rateLimitMs', 100);
  }

  private createClient(creds: JiraCredentials): AxiosInstance {
    return axios.create({
      baseURL: creds.baseUrl,
      auth: { username: creds.email, password: creds.apiToken },
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      timeout: 30000,
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================
  // Projects
  // ============================================

  async getProjects(creds: JiraCredentials): Promise<JiraProject[]> {
    const client = this.createClient(creds);
    try {
      const { data } = await client.get<JiraProject[]>('/rest/api/3/project');
      return data;
    } catch (error: any) {
      this.logger.error(`getProjects failed: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // Issues / Search
  // ============================================

  async getIssue(creds: JiraCredentials, issueKey: string): Promise<JiraIssue> {
    const client = this.createClient(creds);
    try {
      const { data } = await client.get<JiraIssue>(`/rest/api/3/issue/${issueKey}`);
      return data;
    } catch (error: any) {
      this.logger.error(`getIssue(${issueKey}) failed: ${error.message}`);
      throw error;
    }
  }

  async getIssueWithAllDetails(creds: JiraCredentials, issueKey: string): Promise<JiraIssue> {
    const client = this.createClient(creds);
    try {
      const { data } = await client.get<JiraIssue>(`/rest/api/3/issue/${issueKey}`, {
        params: {
          expand: 'changelog,renderedFields,names,schema,transitions',
          fields: '*all',
        },
      });
      return data;
    } catch (error: any) {
      this.logger.error(`getIssueWithAllDetails(${issueKey}) failed: ${error.message}`);
      throw error;
    }
  }

  async searchIssues(
    creds: JiraCredentials,
    jql: string,
    startAt = 0,
    maxResults = 100,
    fields?: string[],
  ): Promise<JiraSearchResponse> {
    const client = this.createClient(creds);
    try {
      const params: Record<string, any> = { jql, startAt, maxResults };
      if (fields && fields.length > 0) {
        params.fields = fields.join(',');
      }

      const response = await client.get<JiraSearchResponse>('/rest/api/3/search', {
        params,
        validateStatus: (status) => status < 500,
      });

      if (response.status === 410) {
        this.logger.warn('GET /rest/api/3/search returned 410, falling back to POST');
        return this.searchIssuesPost(creds, jql, maxResults, fields);
      }

      if (response.status >= 400) {
        const msg = (response.data as any)?.errorMessages?.[0] || 'Unknown error';
        throw new Error(`Jira search failed (${response.status}): ${msg}`);
      }

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 410) {
        return this.searchIssuesPost(creds, jql, maxResults, fields);
      }
      this.logger.error(`searchIssues failed: ${error.message}`);
      throw error;
    }
  }

  private async searchIssuesPost(
    creds: JiraCredentials,
    jql: string,
    maxResults = 100,
    fields?: string[],
  ): Promise<JiraSearchResponse> {
    const client = this.createClient(creds);
    const allIssues: JiraIssue[] = [];
    let nextPageToken: string | null = null;

    const fieldList = fields?.length ? fields : this.defaultFields;

    do {
      const payload: Record<string, any> = { jql, maxResults, fields: fieldList };
      if (nextPageToken) payload.nextPageToken = nextPageToken;

      const { data } = await client.post('/rest/api/3/search/jql', payload);
      const issues = data.issues || [];
      allIssues.push(...issues);

      nextPageToken = data.isLast ? null : (data.nextPageToken || null);
      await this.sleep(this.rateLimitMs);
    } while (nextPageToken);

    return {
      issues: allIssues,
      total: allIssues.length,
      startAt: 0,
      maxResults: allIssues.length,
    };
  }

  async getIssuesBatch(creds: JiraCredentials, issueKeys: string[]): Promise<JiraIssue[]> {
    if (issueKeys.length === 0) return [];
    const jql = `key IN (${issueKeys.join(',')})`;
    const result = await this.searchIssues(creds, jql, 0, issueKeys.length);
    return result.issues;
  }

  // ============================================
  // Comments
  // ============================================

  async getIssueComments(creds: JiraCredentials, issueKey: string): Promise<JiraComment[]> {
    const client = this.createClient(creds);
    try {
      const { data } = await client.get(`/rest/api/3/issue/${issueKey}/comment`);
      return data.comments || [];
    } catch (error: any) {
      this.logger.error(`getIssueComments(${issueKey}) failed: ${error.message}`);
      throw error;
    }
  }

  async addComment(creds: JiraCredentials, issueKey: string, comment: string): Promise<any> {
    const client = this.createClient(creds);
    try {
      const { data } = await client.post(`/rest/api/3/issue/${issueKey}/comment`, {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: comment }],
            },
          ],
        },
      });
      return data;
    } catch (error: any) {
      this.logger.error(`addComment(${issueKey}) failed: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // Worklogs
  // ============================================

  async getIssueWorklogs(creds: JiraCredentials, issueKey: string): Promise<JiraWorklog[]> {
    const client = this.createClient(creds);
    try {
      const { data } = await client.get(`/rest/api/3/issue/${issueKey}/worklog`);
      return data.worklogs || [];
    } catch (error: any) {
      this.logger.error(`getIssueWorklogs(${issueKey}) failed: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // Transitions
  // ============================================

  async getAvailableTransitions(creds: JiraCredentials, issueKey: string): Promise<JiraTransition[]> {
    const client = this.createClient(creds);
    try {
      const { data } = await client.get(`/rest/api/3/issue/${issueKey}/transitions`);
      return data.transitions || [];
    } catch (error: any) {
      this.logger.error(`getAvailableTransitions(${issueKey}) failed: ${error.message}`);
      throw error;
    }
  }

  async transitionIssue(creds: JiraCredentials, issueKey: string, transitionId: string): Promise<boolean> {
    const client = this.createClient(creds);
    try {
      await client.post(`/rest/api/3/issue/${issueKey}/transitions`, {
        transition: { id: transitionId },
      });
      return true;
    } catch (error: any) {
      this.logger.error(`transitionIssue(${issueKey}, ${transitionId}) failed: ${error.message}`);
      return false;
    }
  }

  // ============================================
  // Versions
  // ============================================

  async getProjectVersions(creds: JiraCredentials, projectKey: string): Promise<JiraVersion[]> {
    const client = this.createClient(creds);
    try {
      const { data } = await client.get(`/rest/api/3/project/${projectKey}/version`, {
        params: { maxResults: 1000 },
      });
      return data.values || data || [];
    } catch (error: any) {
      this.logger.error(`getProjectVersions(${projectKey}) failed: ${error.message}`);
      throw error;
    }
  }

  async getVersion(creds: JiraCredentials, versionId: string): Promise<JiraVersion> {
    const client = this.createClient(creds);
    try {
      const { data } = await client.get<JiraVersion>(`/rest/api/3/version/${versionId}`);
      return data;
    } catch (error: any) {
      this.logger.error(`getVersion(${versionId}) failed: ${error.message}`);
      throw error;
    }
  }

  async getVersionIssues(
    creds: JiraCredentials,
    versionId: string,
    type: 'fix' | 'affected' = 'fix',
  ): Promise<JiraIssue[]> {
    const jql = type === 'fix'
      ? `fixVersion = ${versionId} ORDER BY updated DESC`
      : `affectedVersion = ${versionId} ORDER BY updated DESC`;
    const result = await this.searchIssues(creds, jql);
    return result.issues;
  }

  // ============================================
  // Pagination Helper
  // ============================================

  async fetchAllPages<T>(
    callback: (startAt: number, maxResults: number) => Promise<any>,
    maxResults = 100,
  ): Promise<T[]> {
    const allResults: T[] = [];
    let startAt = 0;
    let total: number | null = null;

    do {
      const response = await callback(startAt, maxResults);

      let items: T[];
      if (response.issues) {
        items = response.issues;
        total = response.total || 0;
      } else if (response.values) {
        items = response.values;
        total = response.total ?? items.length;
      } else if (Array.isArray(response)) {
        items = response;
        total = items.length;
      } else {
        break;
      }

      allResults.push(...items);
      startAt += maxResults;

      await this.sleep(this.rateLimitMs);
    } while (total !== null && startAt < total);

    return allResults;
  }

  // ============================================
  // Connection Test
  // ============================================

  async testConnection(creds: JiraCredentials): Promise<{ success: boolean; message: string }> {
    try {
      const projects = await this.getProjects(creds);
      return {
        success: true,
        message: `Connected successfully. Found ${projects.length} projects.`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Connection failed',
      };
    }
  }
}

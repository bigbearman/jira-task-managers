import { registerAs } from '@nestjs/config';

export const configJira = registerAs('jira', () => ({
  defaultApiVersion: process.env.JIRA_API_VERSION || '3',
  cache: {
    projectsTtl: Number(process.env.JIRA_CACHE_PROJECTS_TTL) || 3600,
    tasksTtl: Number(process.env.JIRA_CACHE_TASKS_TTL) || 300,
    transitionsTtl: Number(process.env.JIRA_CACHE_TRANSITIONS_TTL) || 300,
  },
  sync: {
    batchSize: Number(process.env.JIRA_SYNC_BATCH_SIZE) || 50,
    rateLimitMs: Number(process.env.JIRA_RATE_LIMIT_MS) || 100,
    maxRetries: Number(process.env.JIRA_SYNC_MAX_RETRIES) || 3,
  },
  statuses: {
    todo: ['To Do', 'Open', 'New', 'Backlog'],
    inProgress: ['In Progress', 'Development', 'In Development'],
    review: ['Code Review', 'Testing', 'In Review', 'QA'],
    done: ['Done', 'Closed', 'Resolved'],
  },
}));

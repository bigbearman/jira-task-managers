import type {
  ApiResponse,
  PaginatedResponse,
  DashboardOverview,
  SprintVelocity,
  AiStats,
  Project,
  ProjectStats,
  Sprint,
  SprintStats,
  Version,
  Ticket,
  Comment,
  Worklog,
  AiAnalysis,
  GitOperation,
  TaskAction,
  SyncLog,
  JiraInstance,
  CreateInstanceDto,
  UpdateInstanceDto,
} from '@/types/api';

const API_BASE = '/api/v1';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  dashboard: {
    overview: () => fetchApi<ApiResponse<DashboardOverview>>('/dashboard/overview'),
    sprintVelocity: (projectKey?: string) =>
      fetchApi<ApiResponse<SprintVelocity[]>>(`/dashboard/sprint-velocity${projectKey ? `?projectKey=${projectKey}` : ''}`),
    aiStats: () => fetchApi<ApiResponse<AiStats>>('/dashboard/ai-stats'),
  },

  projects: {
    list: (params?: { page?: number; limit?: number; search?: string }) => {
      const qs = params ? '?' + new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]),
      ).toString() : '';
      return fetchApi<PaginatedResponse<Project>>(`/projects${qs}`);
    },
    get: (key: string) => fetchApi<ApiResponse<Project>>(`/projects/${key}`),
    stats: (key: string) => fetchApi<ApiResponse<ProjectStats>>(`/projects/${key}/stats`),
  },

  sprints: {
    byProject: (key: string) => fetchApi<ApiResponse<Sprint[]>>(`/projects/${key}/sprints`),
    active: (projectKey?: string) =>
      fetchApi<ApiResponse<Sprint[]>>(`/sprints/active${projectKey ? `?projectKey=${projectKey}` : ''}`),
    get: (id: string) => fetchApi<ApiResponse<Sprint>>(`/sprints/${id}`),
    tickets: (id: string, page = 1, limit = 20) =>
      fetchApi<PaginatedResponse<Ticket>>(`/sprints/${id}/tickets?page=${page}&limit=${limit}`),
    stats: (id: string) => fetchApi<ApiResponse<SprintStats>>(`/sprints/${id}/stats`),
  },

  versions: {
    byProject: (key: string) => fetchApi<ApiResponse<Version[]>>(`/projects/${key}/versions`),
    unreleased: (projectKey?: string) =>
      fetchApi<ApiResponse<Version[]>>(`/versions/unreleased${projectKey ? `?projectKey=${projectKey}` : ''}`),
    get: (id: string) => fetchApi<ApiResponse<Version>>(`/versions/${id}`),
    tickets: (id: string, page = 1, limit = 20) =>
      fetchApi<PaginatedResponse<Ticket>>(`/versions/${id}/tickets?page=${page}&limit=${limit}`),
  },

  tickets: {
    list: (params?: Record<string, string | number>) => {
      const qs = params ? '?' + new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ).toString() : '';
      return fetchApi<PaginatedResponse<Ticket>>(`/tickets${qs}`);
    },
    get: (key: string) => fetchApi<ApiResponse<Ticket>>(`/tickets/${key}`),
    comments: (key: string) => fetchApi<ApiResponse<Comment[]>>(`/tickets/${key}/comments`),
    worklogs: (key: string) => fetchApi<ApiResponse<Worklog[]>>(`/tickets/${key}/worklogs`),
    aiAnalysis: (key: string) => fetchApi<ApiResponse<AiAnalysis | null>>(`/tickets/${key}/ai-analysis`),
    gitStatus: (key: string) => fetchApi<ApiResponse<GitOperation[]>>(`/tickets/${key}/git-status`),
    actions: (key: string) => fetchApi<ApiResponse<TaskAction[]>>(`/tickets/${key}/actions`),
  },

  taskActions: {
    analyze: (key: string, body?: Record<string, unknown>) =>
      fetchApi<ApiResponse<TaskAction>>(`/tickets/${key}/analyze`, { method: 'POST', body: JSON.stringify(body ?? {}) }),
    approve: (key: string, body?: Record<string, unknown>) =>
      fetchApi<ApiResponse<TaskAction>>(`/tickets/${key}/approve`, { method: 'POST', body: JSON.stringify(body ?? {}) }),
    reject: (key: string) =>
      fetchApi<ApiResponse<TaskAction>>(`/tickets/${key}/reject`, { method: 'POST', body: '{}' }),
    unreject: (key: string) =>
      fetchApi<ApiResponse<TaskAction>>(`/tickets/${key}/unreject`, { method: 'POST', body: '{}' }),
    editApproach: (key: string, body: Record<string, unknown>) =>
      fetchApi<ApiResponse<TaskAction>>(`/tickets/${key}/approach`, { method: 'PUT', body: JSON.stringify(body) }),
  },

  sync: {
    trigger: () => fetchApi<ApiResponse<{ message: string }>>('/sync', { method: 'POST' }),
    logs: () => fetchApi<ApiResponse<SyncLog[]>>('/sync/logs'),
  },

  instances: {
    list: () => fetchApi<ApiResponse<JiraInstance[]>>('/instances'),
    get: (slug: string) => fetchApi<ApiResponse<JiraInstance>>(`/instances/${slug}`),
    create: (body: CreateInstanceDto) =>
      fetchApi<ApiResponse<JiraInstance>>('/instances', { method: 'POST', body: JSON.stringify(body) }),
    update: (slug: string, body: UpdateInstanceDto) =>
      fetchApi<ApiResponse<JiraInstance>>(`/instances/${slug}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (slug: string) =>
      fetchApi<ApiResponse<{ message: string }>>(`/instances/${slug}`, { method: 'DELETE' }),
    test: (slug: string) =>
      fetchApi<ApiResponse<{ success: boolean }>>(`/instances/${slug}/test`, { method: 'POST' }),
  },
};

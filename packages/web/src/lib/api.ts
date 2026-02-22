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

// Dashboard
export const api = {
  dashboard: {
    overview: () => fetchApi<any>('/dashboard/overview'),
    sprintVelocity: (projectKey?: string) =>
      fetchApi<any>(`/dashboard/sprint-velocity${projectKey ? `?projectKey=${projectKey}` : ''}`),
    aiStats: () => fetchApi<any>('/dashboard/ai-stats'),
  },

  projects: {
    list: () => fetchApi<any>('/projects'),
    get: (key: string) => fetchApi<any>(`/projects/${key}`),
    stats: (key: string) => fetchApi<any>(`/projects/${key}/stats`),
  },

  sprints: {
    byProject: (key: string) => fetchApi<any>(`/projects/${key}/sprints`),
    active: (projectKey?: string) =>
      fetchApi<any>(`/sprints/active${projectKey ? `?projectKey=${projectKey}` : ''}`),
    get: (id: string) => fetchApi<any>(`/sprints/${id}`),
    tickets: (id: string, page = 1, limit = 20) =>
      fetchApi<any>(`/sprints/${id}/tickets?page=${page}&limit=${limit}`),
    stats: (id: string) => fetchApi<any>(`/sprints/${id}/stats`),
  },

  versions: {
    byProject: (key: string) => fetchApi<any>(`/projects/${key}/versions`),
    unreleased: (projectKey?: string) =>
      fetchApi<any>(`/versions/unreleased${projectKey ? `?projectKey=${projectKey}` : ''}`),
    get: (id: string) => fetchApi<any>(`/versions/${id}`),
    tickets: (id: string, page = 1, limit = 20) =>
      fetchApi<any>(`/versions/${id}/tickets?page=${page}&limit=${limit}`),
  },

  tickets: {
    list: (params?: Record<string, string | number>) => {
      const qs = params ? '?' + new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ).toString() : '';
      return fetchApi<any>(`/tickets${qs}`);
    },
    get: (key: string) => fetchApi<any>(`/tickets/${key}`),
    comments: (key: string) => fetchApi<any>(`/tickets/${key}/comments`),
    worklogs: (key: string) => fetchApi<any>(`/tickets/${key}/worklogs`),
    aiAnalysis: (key: string) => fetchApi<any>(`/tickets/${key}/ai-analysis`),
    gitStatus: (key: string) => fetchApi<any>(`/tickets/${key}/git-status`),
    actions: (key: string) => fetchApi<any>(`/tickets/${key}/actions`),
  },

  taskActions: {
    analyze: (key: string, body?: any) =>
      fetchApi<any>(`/tickets/${key}/analyze`, { method: 'POST', body: JSON.stringify(body ?? {}) }),
    approve: (key: string, body?: any) =>
      fetchApi<any>(`/tickets/${key}/approve`, { method: 'POST', body: JSON.stringify(body ?? {}) }),
    reject: (key: string) =>
      fetchApi<any>(`/tickets/${key}/reject`, { method: 'POST', body: '{}' }),
    unreject: (key: string) =>
      fetchApi<any>(`/tickets/${key}/unreject`, { method: 'POST', body: '{}' }),
    editApproach: (key: string, body: any) =>
      fetchApi<any>(`/tickets/${key}/approach`, { method: 'PUT', body: JSON.stringify(body) }),
  },

  sync: {
    trigger: () => fetchApi<any>('/sync', { method: 'POST' }),
    logs: () => fetchApi<any>('/sync/logs'),
  },

  instances: {
    list: () => fetchApi<any>('/instances'),
    get: (slug: string) => fetchApi<any>(`/instances/${slug}`),
    test: (slug: string) => fetchApi<any>(`/instances/${slug}/test`, { method: 'POST' }),
  },
};

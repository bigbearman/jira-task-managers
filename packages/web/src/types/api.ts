// API response types matching backend entities

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface JiraInstance {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  email: string;
  isActive: boolean;
  syncEnabled: boolean;
  assignees: string[] | null;
  projectKeys: string[] | null;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  jiraProjectId: string;
  jiraProjectKey: string;
  name: string;
  description: string | null;
  projectType: string | null;
  avatarUrl: string | null;
  lead: string | null;
  instanceId: string;
  createdAt: string;
}

export interface Sprint {
  id: string;
  jiraSprintId: number;
  name: string;
  state: 'active' | 'closed' | 'future';
  startDate: string | null;
  endDate: string | null;
  completeDate: string | null;
  goal: string | null;
}

export interface Version {
  id: string;
  jiraVersionId: string;
  name: string;
  description: string | null;
  isReleased: boolean;
  isArchived: boolean;
  releaseDate: string | null;
  startDate: string | null;
}

export interface Ticket {
  id: string;
  jiraTicketId: string;
  jiraTicketKey: string;
  jiraProjectId: string;
  summary: string;
  description: string | null;
  issueType: string | null;
  status: string | null;
  priority: string | null;
  assigneeDisplayName: string | null;
  reporterDisplayName: string | null;
  storyPoints: number | null;
  dueDate: string | null;
  resolution: string | null;
  labels: string[] | null;
  components: string[] | null;
  parentKey: string | null;
  epicKey: string | null;
  jiraCreatedAt: string | null;
  jiraUpdatedAt: string | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  jiraCommentId: string;
  authorDisplayName: string | null;
  body: string | null;
  renderedBody: string | null;
  jiraCreatedAt: string | null;
}

export interface Worklog {
  id: string;
  authorDisplayName: string | null;
  timeSpent: string | null;
  timeSpentSeconds: number | null;
  comment: string | null;
  startedAt: string | null;
}

export interface TaskAction {
  id: string;
  ticketId: string;
  actionType: 'approved' | 'rejected' | 'unrejected' | 'edit_approach';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  inputContext: Record<string, any> | null;
  outputResult: Record<string, any> | null;
  triggeredBy: string | null;
  errorMessage: string | null;
  createdAt: string;
  ticket?: Ticket;
}

export interface AiAnalysis {
  id: string;
  ticketId: string;
  analysisType: 'summary' | 'solution' | 'code_review' | 'test_generation';
  prompt: string | null;
  response: string | null;
  model: string | null;
  tokensUsed: number | null;
  costUsd: number | null;
  durationMs: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface GitOperation {
  id: string;
  ticketId: string;
  taskActionId: string;
  operationType: string;
  branchName: string | null;
  prNumber: number | null;
  prUrl: string | null;
  commitSha: string | null;
  ciStatus: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface DashboardOverview {
  projects: Array<{ id: string; key: string; name: string }>;
  totalProjects: number;
  tickets: { total: number; done: number; inProgress: number; todo: number };
  activeSprints: Sprint[];
  recentActions: TaskAction[];
}

export interface SprintVelocity {
  sprintId: string;
  sprintName: string;
  state: string;
  startDate: string | null;
  endDate: string | null;
  totalTickets: number;
  completedTickets: number;
  totalPoints: number;
  completedPoints: number;
}

export interface AiStats {
  totalAnalyses: number;
  completed: number;
  failed: number;
  totalTokens: number;
  totalCostUsd: number;
  avgDurationMs: number;
  recentAnalyses: AiAnalysis[];
}

export interface ProjectStats {
  project: Project;
  tickets: { total: number; done: number; inProgress: number; todo: number };
  sprints: { total: number; active: number };
  versions: { total: number; unreleased: number };
}

export interface SyncLog {
  id: string;
  instanceId: string | null;
  syncType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  itemsProcessed: number | null;
  itemsCreated: number | null;
  itemsUpdated: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface SprintStats {
  totalTickets: number;
  completedTickets: number;
  inProgressTickets: number;
  todoTickets: number;
  totalPoints: number;
  completedPoints: number;
}

export interface CreateInstanceDto {
  name: string;
  slug: string;
  baseUrl: string;
  email: string;
  apiToken: string;
  syncEnabled?: boolean;
  assignees?: string[];
  projectKeys?: string[];
}

export interface UpdateInstanceDto {
  name?: string;
  baseUrl?: string;
  email?: string;
  apiToken?: string;
  isActive?: boolean;
  syncEnabled?: boolean;
  assignees?: string[];
  projectKeys?: string[];
}

export interface JiraCredentials {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
  startAt: number;
  maxResults: number;
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: JiraIssueFields;
}

export interface JiraIssueFields {
  summary: string;
  description: any;
  status: { name: string; id: string };
  issuetype: { name: string; id: string; subtask?: boolean };
  priority: { name: string; id: string } | null;
  assignee: { accountId: string; displayName: string } | null;
  reporter: { accountId: string; displayName: string } | null;
  creator: { accountId: string; displayName: string } | null;
  project: { id: string; key: string; name: string };
  created: string;
  updated: string;
  duedate: string | null;
  resolution: { name: string } | null;
  resolutiondate: string | null;
  labels: string[];
  components: Array<{ name: string }>;
  parent?: { key: string; fields?: { summary: string } };
  customfield_10016?: number | null;
  fixVersions?: JiraVersion[];
  versions?: JiraVersion[];
  timeoriginalestimate: number | null;
  timeestimate: number | null;
  timespent: number | null;
  comment?: { comments: JiraComment[]; total: number };
  worklog?: { worklogs: JiraWorklog[]; total: number };
  attachment?: JiraAttachment[];
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  projectTypeKey: string;
  lead?: { accountId: string; displayName: string };
  avatarUrls?: Record<string, string>;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  goal?: string;
  originBoardId?: number;
}

export interface JiraVersion {
  id: string;
  name: string;
  description?: string;
  released: boolean;
  archived: boolean;
  releaseDate?: string;
  startDate?: string;
  projectId?: number;
}

export interface JiraComment {
  id: string;
  author: { accountId: string; displayName: string };
  body: any;
  renderedBody?: string;
  created: string;
  updated: string;
  jsdPublic?: boolean;
}

export interface JiraWorklog {
  id: string;
  author: { accountId: string; displayName: string };
  timeSpent: string;
  timeSpentSeconds: number;
  comment?: any;
  started: string;
  created: string;
  updated: string;
}

export interface JiraAttachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  content: string;
  thumbnail?: string;
  author: { accountId: string; displayName: string };
  created: string;
}

export interface JiraBoard {
  id: number;
  name: string;
  type: string;
  location?: { projectId: number; projectKey: string; projectName: string };
}

export interface JiraTransition {
  id: string;
  name: string;
  to: { name: string; id: string };
}

export interface PaginatedResponse<T> {
  values?: T[];
  issues?: T[];
  total: number;
  startAt: number;
  maxResults: number;
  isLast?: boolean;
}

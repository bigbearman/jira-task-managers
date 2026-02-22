export const STATUS_ICONS: Record<string, string> = {
  done: '\u2705',
  closed: '\u2705',
  resolved: '\u2705',
  'in progress': '\ud83d\udd04',
  development: '\ud83d\udd04',
  'in development': '\ud83d\udd04',
  'code review': '\ud83d\udc40',
  testing: '\ud83e\uddea',
  'in review': '\ud83d\udc40',
  qa: '\ud83e\uddea',
  'to do': '\ud83d\udccb',
  open: '\ud83d\udccb',
  new: '\ud83d\udccb',
  backlog: '\ud83d\udce6',
  blocked: '\ud83d\udeab',
};

export const PRIORITY_ICONS: Record<string, string> = {
  highest: '\ud83d\udd34',
  high: '\ud83d\udfe0',
  medium: '\ud83d\udfe1',
  low: '\ud83d\udfe2',
  lowest: '\u26aa',
};

export const TYPE_ICONS: Record<string, string> = {
  bug: '\ud83d\udc1b',
  story: '\ud83d\udcd6',
  task: '\u2705',
  'sub-task': '\ud83d\udccb',
  epic: '\u26a1',
  improvement: '\ud83d\udca1',
};

export function getStatusIcon(status: string): string {
  return STATUS_ICONS[status.toLowerCase()] || '\u2b55';
}

export function getPriorityIcon(priority: string): string {
  return PRIORITY_ICONS[priority.toLowerCase()] || '\u26aa';
}

export function getTypeIcon(type: string): string {
  return TYPE_ICONS[type.toLowerCase()] || '\ud83d\udccb';
}

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  // Done states
  Done: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  Closed: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  Resolved: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  completed: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  Released: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  active: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  // In Progress states
  'In Progress': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  Development: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  'In Development': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  'Code Review': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  Testing: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  'In Review': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  QA: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  running: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  processing: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  // Todo states
  'To Do': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Open: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  New: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  pending: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  future: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  // Error states
  failed: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  // Neutral
  Backlog: 'bg-muted text-muted-foreground border-border',
  closed: 'bg-muted text-muted-foreground border-border',
  Unreleased: 'bg-muted text-muted-foreground border-border',
};

const DEFAULT_COLOR = 'bg-muted text-muted-foreground border-border';

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return <span className="text-muted-foreground">-</span>;
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', STATUS_COLORS[status] ?? DEFAULT_COLOR, className)}
    >
      {status}
    </Badge>
  );
}

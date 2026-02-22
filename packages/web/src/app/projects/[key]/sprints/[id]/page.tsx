'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { use } from 'react';
import type { Ticket, SprintStats } from '@/types/api';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { TicketCheck, CheckCircle2, Clock, ListTodo, Target } from 'lucide-react';

const STATUS_GROUPS = {
  todo: ['To Do', 'Open', 'New', 'Backlog'],
  inProgress: ['In Progress', 'Development', 'In Development', 'Code Review', 'Testing', 'In Review', 'QA'],
  done: ['Done', 'Closed', 'Resolved'],
};

function getGroup(status: string | null): 'todo' | 'inProgress' | 'done' {
  if (!status) return 'todo';
  if (STATUS_GROUPS.done.includes(status)) return 'done';
  if (STATUS_GROUPS.inProgress.includes(status)) return 'inProgress';
  return 'todo';
}

export default function SprintBoardPage({ params }: { params: Promise<{ key: string; id: string }> }) {
  const { key, id } = use(params);

  const { data: sprintData } = useQuery({
    queryKey: ['sprints', id],
    queryFn: () => api.sprints.get(id),
  });

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['sprints', id, 'tickets'],
    queryFn: () => api.sprints.tickets(id, 1, 100),
  });

  const { data: statsData } = useQuery({
    queryKey: ['sprints', id, 'stats'],
    queryFn: () => api.sprints.stats(id),
  });

  const sprint = sprintData?.data;
  const tickets: Ticket[] = ticketsData?.data ?? [];
  const stats: SprintStats | undefined = statsData?.data;

  const columns = {
    todo: tickets.filter((t) => getGroup(t.status) === 'todo'),
    inProgress: tickets.filter((t) => getGroup(t.status) === 'inProgress'),
    done: tickets.filter((t) => getGroup(t.status) === 'done'),
  };

  const totalTickets = tickets.length;
  const doneTickets = columns.done.length;
  const completionPct = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;

  // Days remaining
  let daysRemaining: string | null = null;
  if (sprint?.endDate) {
    const diff = Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    daysRemaining = diff > 0 ? `${diff} days left` : diff === 0 ? 'Ends today' : 'Ended';
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={sprint?.name ?? 'Sprint'}
        description={sprint?.goal ?? undefined}
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: key, href: `/projects/${key}` },
          { label: sprint?.name ?? 'Sprint' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={sprint?.state} />
            {daysRemaining && (
              <span className="text-sm text-muted-foreground">{daysRemaining}</span>
            )}
          </div>
        }
      />

      {/* Sprint dates */}
      {sprint?.startDate && (
        <p className="text-sm text-muted-foreground">
          {new Date(sprint.startDate).toLocaleDateString('vi-VN')}
          {sprint.endDate && ` — ${new Date(sprint.endDate).toLocaleDateString('vi-VN')}`}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total" value={stats?.totalTickets ?? totalTickets} icon={TicketCheck} />
        <StatCard label="Done" value={stats?.completedTickets ?? doneTickets} icon={CheckCircle2} />
        <StatCard label="In Progress" value={stats?.inProgressTickets ?? columns.inProgress.length} icon={Clock} />
        <StatCard label="To Do" value={stats?.todoTickets ?? columns.todo.length} icon={ListTodo} />
        <StatCard
          label="Story Points"
          value={`${stats?.completedPoints ?? 0}/${stats?.totalPoints ?? 0}`}
          icon={Target}
        />
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Sprint Progress</span>
          <span className="font-medium">{completionPct}%</span>
        </div>
        <Progress value={completionPct} className="h-3" />
      </div>

      {/* Kanban Board */}
      {totalTickets === 0 ? (
        <EmptyState icon={ListTodo} title="No tickets" description="No tickets in this sprint." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <KanbanColumn title="To Do" tickets={columns.todo} color="blue" />
          <KanbanColumn title="In Progress" tickets={columns.inProgress} color="yellow" />
          <KanbanColumn title="Done" tickets={columns.done} color="green" />
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ title, tickets, color }: { title: string; tickets: Ticket[]; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'border-blue-500/30 bg-blue-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
    green: 'border-green-500/30 bg-green-500/5',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color] ?? ''}`}>
      <h3 className="mb-3 text-sm font-semibold">
        {title} ({tickets.length})
      </h3>
      <div className="space-y-2">
        {tickets.map((t) => (
          <Link key={t.id} href={`/tickets/${t.jiraTicketKey}`}>
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{t.jiraTicketKey}</span>
                  {t.storyPoints != null && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
                      {t.storyPoints}sp
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm">{t.summary}</p>
                {t.assigneeDisplayName && (
                  <p className="mt-2 text-xs text-muted-foreground">{t.assigneeDisplayName}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { use } from 'react';
import type { Ticket } from '@/types/api';

const STATUS_GROUPS = {
  todo: ['To Do', 'Open', 'New', 'Backlog'],
  inProgress: ['In Progress', 'Development', 'In Development', 'Code Review', 'Testing', 'In Review', 'QA'],
  done: ['Done', 'Closed', 'Resolved'],
};

function getGroup(status: string | null): 'todo' | 'inProgress' | 'done' {
  if (!status) return 'todo';
  const s = status;
  if (STATUS_GROUPS.done.includes(s)) return 'done';
  if (STATUS_GROUPS.inProgress.includes(s)) return 'inProgress';
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

  const sprint = sprintData?.data;
  const tickets: Ticket[] = ticketsData?.data ?? [];

  const columns = {
    todo: tickets.filter((t) => getGroup(t.status) === 'todo'),
    inProgress: tickets.filter((t) => getGroup(t.status) === 'inProgress'),
    done: tickets.filter((t) => getGroup(t.status) === 'done'),
  };

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Loading sprint...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/projects/${key}`} className="text-sm text-muted-foreground hover:underline">
          &larr; {key}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{sprint?.name ?? 'Sprint'}</h1>
        {sprint?.goal && <p className="text-sm text-muted-foreground">{sprint.goal}</p>}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KanbanColumn title="To Do" tickets={columns.todo} color="blue" />
        <KanbanColumn title="In Progress" tickets={columns.inProgress} color="yellow" />
        <KanbanColumn title="Done" tickets={columns.done} color="green" />
      </div>
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
          <Link
            key={t.id}
            href={`/tickets/${t.jiraTicketKey}`}
            className="block rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{t.jiraTicketKey}</span>
              {t.storyPoints && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
                  {t.storyPoints}sp
                </span>
              )}
            </div>
            <p className="mt-1 text-sm">{t.summary}</p>
            {t.assigneeDisplayName && (
              <p className="mt-2 text-xs text-muted-foreground">{t.assigneeDisplayName}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

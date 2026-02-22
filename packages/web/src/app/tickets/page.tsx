'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Ticket } from '@/types/api';
import { useState, Suspense } from 'react';

function TicketsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get('page') ?? 1);
  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [assignee, setAssignee] = useState(searchParams.get('assignee') ?? '');

  const params: Record<string, string | number> = { page, limit: 20 };
  if (status) params.status = status;
  if (assignee) params.assignee = assignee;

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', params],
    queryFn: () => api.tickets.list(params),
  });

  const tickets: Ticket[] = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tickets</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
          <option value="Backlog">Backlog</option>
        </select>
        <input
          type="text"
          placeholder="Filter by assignee..."
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="animate-pulse text-muted-foreground">Loading tickets...</div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">SP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-accent">
                  <td className="px-4 py-3">
                    <Link href={`/tickets/${t.jiraTicketKey}`} className="font-medium text-primary hover:underline">
                      {t.jiraTicketKey}
                    </Link>
                  </td>
                  <td className="max-w-md truncate px-4 py-3">{t.summary}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.issueType}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.priority}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.assigneeDisplayName ?? '-'}</td>
                  <td className="px-4 py-3 text-center">{t.storyPoints ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => router.push(`/tickets?page=${page - 1}`)}
            className="rounded border border-input px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            disabled={page >= meta.totalPages}
            onClick={() => router.push(`/tickets?page=${page + 1}`)}
            className="rounded border border-input px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-muted-foreground">Loading tickets...</div>}>
      <TicketsContent />
    </Suspense>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">-</span>;
  const colors: Record<string, string> = {
    Done: 'bg-green-500/10 text-green-500',
    Closed: 'bg-green-500/10 text-green-500',
    Resolved: 'bg-green-500/10 text-green-500',
    'In Progress': 'bg-yellow-500/10 text-yellow-500',
    Development: 'bg-yellow-500/10 text-yellow-500',
    'To Do': 'bg-blue-500/10 text-blue-500',
    Backlog: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  );
}

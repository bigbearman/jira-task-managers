'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { use, useState } from 'react';
import type { Ticket } from '@/types/api';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { TicketCheck, CheckCircle2, Clock, ListTodo, Package } from 'lucide-react';

const DONE_STATUSES = ['Done', 'Closed', 'Resolved'];
const IN_PROGRESS_STATUSES = ['In Progress', 'Development', 'In Development', 'Code Review', 'Testing', 'In Review', 'QA'];

export default function VersionDetailPage({ params }: { params: Promise<{ key: string; id: string }> }) {
  const { key, id } = use(params);
  const [page, setPage] = useState(1);
  const limit = 30;

  const { data: versionData } = useQuery({
    queryKey: ['versions', id],
    queryFn: () => api.versions.get(id),
  });

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['versions', id, 'tickets', page],
    queryFn: () => api.versions.tickets(id, page, limit),
  });

  const version = versionData?.data;
  const tickets: Ticket[] = ticketsData?.data ?? [];
  const meta = ticketsData?.meta ?? { total: 0, page: 1, totalPages: 1 };

  // Calculate stats from tickets
  const totalTickets = meta.total || tickets.length;
  const doneTickets = tickets.filter((t) => DONE_STATUSES.includes(t.status ?? '')).length;
  const inProgressTickets = tickets.filter((t) => IN_PROGRESS_STATUSES.includes(t.status ?? '')).length;
  const todoTickets = tickets.length - doneTickets - inProgressTickets;
  const completionPct = totalTickets > 0 ? Math.round((doneTickets / tickets.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
        title={version?.name ?? 'Version'}
        description={version?.description ?? undefined}
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: key, href: `/projects/${key}` },
          { label: version?.name ?? 'Version' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={version?.isReleased ? 'Released' : 'Unreleased'} />
            {version?.releaseDate && (
              <span className="text-sm text-muted-foreground">
                {new Date(version.releaseDate).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={totalTickets} icon={TicketCheck} />
        <StatCard label="Done" value={doneTickets} icon={CheckCircle2} />
        <StatCard label="In Progress" value={inProgressTickets} icon={Clock} />
        <StatCard label="To Do" value={todoTickets} icon={ListTodo} />
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Release Progress</span>
          <span className="font-medium">{completionPct}%</span>
        </div>
        <Progress value={completionPct} className="h-3" />
      </div>

      {/* Ticket Table */}
      {tickets.length === 0 ? (
        <EmptyState icon={Package} title="No tickets" description="No tickets in this version." />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead className="text-center">SP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link href={`/tickets/${t.jiraTicketKey}`} className="font-medium text-primary hover:underline">
                      {t.jiraTicketKey}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-md truncate">{t.summary}</TableCell>
                  <TableCell className="text-muted-foreground">{t.issueType}</TableCell>
                  <TableCell>
                    <StatusBadge status={t.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.assigneeDisplayName ?? '-'}</TableCell>
                  <TableCell className="text-center">{t.storyPoints ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
}

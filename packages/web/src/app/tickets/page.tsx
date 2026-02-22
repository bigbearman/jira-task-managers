'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Ticket } from '@/types/api';
import { useState, Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ListTodo } from 'lucide-react';

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
      <PageHeader title="Tickets" description={`${meta.total} tickets total`} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="To Do">To Do</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
            <SelectItem value="Backlog">Backlog</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="text"
          placeholder="Filter by assignee..."
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="w-[200px]"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState icon={ListTodo} title="No tickets found" description="Try adjusting your filters." />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
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
                  <TableCell className="text-muted-foreground">{t.priority}</TableCell>
                  <TableCell className="text-muted-foreground">{t.assigneeDisplayName ?? '-'}</TableCell>
                  <TableCell className="text-center">{t.storyPoints ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        onPageChange={(p) => router.push(`/tickets?page=${p}`)}
      />
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded" />
            ))}
          </div>
        </div>
      }
    >
      <TicketsContent />
    </Suspense>
  );
}

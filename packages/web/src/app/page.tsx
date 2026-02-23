'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import type { DashboardOverview, AiStats } from '@/types/api';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  TicketCheck,
  CheckCircle2,
  Clock,
  ListTodo,
  FolderKanban,
  Brain,
  Coins,
  Zap,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: api.dashboard.overview,
  });

  const { data: aiStats } = useQuery({
    queryKey: ['dashboard', 'ai-stats'],
    queryFn: api.dashboard.aiStats,
  });

  const ov: DashboardOverview | undefined = overview?.data;
  const ai: AiStats | undefined = aiStats?.data;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Overview of all Jira instances and activity" />

      {/* Ticket Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Tickets" value={ov?.tickets.total ?? 0} icon={TicketCheck} />
        <StatCard
          label="Done"
          value={ov?.tickets.done ?? 0}
          icon={CheckCircle2}
          sub={`${ov?.tickets.total ? Math.round(((ov?.tickets.done ?? 0) / ov.tickets.total) * 100) : 0}%`}
        />
        <StatCard label="In Progress" value={ov?.tickets.inProgress ?? 0} icon={Clock} />
        <StatCard label="To Do" value={ov?.tickets.todo ?? 0} icon={ListTodo} />
      </div>

      {/* Projects */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Projects
            {(ov?.totalProjects ?? 0) > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({ov?.totalProjects})
              </span>
            )}
          </h2>
          {(ov?.totalProjects ?? 0) > 6 && (
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
        {(ov?.projects?.length ?? 0) === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Add a Jira instance and sync to see your projects here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ov?.projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.key}`}>
                <Card className="p-4 transition-colors hover:bg-accent">
                  <p className="font-semibold">{p.key}</p>
                  <p className="text-sm text-muted-foreground">{p.name}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Active Sprints */}
      {(ov?.activeSprints?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Active Sprints</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ov?.activeSprints.map((s) => (
              <Card key={s.id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{s.name}</p>
                  <StatusBadge status={s.state} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {s.startDate && new Date(s.startDate).toLocaleDateString('vi-VN')} &mdash;{' '}
                  {s.endDate && new Date(s.endDate).toLocaleDateString('vi-VN')}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* AI Stats */}
      {ai && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">AI Usage</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Analyses" value={ai.totalAnalyses} icon={Brain} />
            <StatCard label="Completed" value={ai.completed} icon={CheckCircle2} />
            <StatCard label="Total Tokens" value={ai.totalTokens.toLocaleString()} icon={Zap} />
            <StatCard label="Total Cost" value={`$${ai.totalCostUsd.toFixed(4)}`} icon={Coins} />
          </div>
        </section>
      )}

      {/* Recent Actions */}
      {(ov?.recentActions?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Recent Actions</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ov?.recentActions.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Badge variant="secondary">{a.actionType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/tickets/${a.ticket?.jiraTicketKey ?? ''}`}
                        className="hover:underline"
                      >
                        <span className="font-medium">{a.ticket?.jiraTicketKey ?? 'N/A'}</span>{' '}
                        <span className="text-muted-foreground">
                          {a.ticket?.summary?.substring(0, 60) ?? ''}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={a.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      )}
    </div>
  );
}

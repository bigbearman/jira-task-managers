'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import type { DashboardOverview, SprintVelocity, AiStats } from '@/types/api';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

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
    return <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Ticket Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Tickets" value={ov?.tickets.total ?? 0} />
        <StatCard label="Done" value={ov?.tickets.done ?? 0} sub={`${ov?.tickets.total ? Math.round(((ov?.tickets.done ?? 0) / ov.tickets.total) * 100) : 0}%`} />
        <StatCard label="In Progress" value={ov?.tickets.inProgress ?? 0} />
        <StatCard label="To Do" value={ov?.tickets.todo ?? 0} />
      </div>

      {/* Projects */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Projects</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ov?.projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.key}`}
              className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
            >
              <p className="font-semibold">{p.key}</p>
              <p className="text-sm text-muted-foreground">{p.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Active Sprints */}
      {(ov?.activeSprints?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Active Sprints</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ov?.activeSprints.map((s) => (
              <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-muted-foreground">
                  {s.startDate && new Date(s.startDate).toLocaleDateString('vi-VN')} — {s.endDate && new Date(s.endDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Stats */}
      {ai && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">AI Usage</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Analyses" value={ai.totalAnalyses} />
            <StatCard label="Completed" value={ai.completed} />
            <StatCard label="Total Tokens" value={ai.totalTokens.toLocaleString()} />
            <StatCard label="Total Cost" value={`$${ai.totalCostUsd.toFixed(4)}`} />
          </div>
        </section>
      )}

      {/* Recent Actions */}
      {(ov?.recentActions?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Recent Actions</h2>
          <div className="rounded-xl border border-border bg-card">
            <div className="divide-y divide-border">
              {ov?.recentActions.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <span className="mr-2 rounded bg-secondary px-2 py-0.5 text-xs font-medium">
                      {a.actionType}
                    </span>
                    <Link href={`/tickets/${a.ticket?.jiraTicketKey ?? ''}`} className="text-sm hover:underline">
                      {a.ticket?.jiraTicketKey ?? 'N/A'}: {a.ticket?.summary?.substring(0, 60) ?? ''}
                    </Link>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                    a.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                    a.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                    a.status === 'processing' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

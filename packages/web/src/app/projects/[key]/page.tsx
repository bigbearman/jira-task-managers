'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { use } from 'react';
import type { ProjectStats, Sprint, Version } from '@/types/api';

export default function ProjectDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params);

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['projects', key, 'stats'],
    queryFn: () => api.projects.stats(key),
  });

  const { data: sprintsData } = useQuery({
    queryKey: ['projects', key, 'sprints'],
    queryFn: () => api.sprints.byProject(key),
  });

  const { data: versionsData } = useQuery({
    queryKey: ['projects', key, 'versions'],
    queryFn: () => api.versions.byProject(key),
  });

  const stats: ProjectStats | undefined = statsData?.data;
  const sprints: Sprint[] = sprintsData?.data ?? [];
  const versions: Version[] = versionsData?.data ?? [];

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Loading project...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{key}: {stats?.project?.name}</h1>
        {stats?.project?.description && (
          <p className="mt-1 text-muted-foreground">{stats.project.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox label="Tickets" value={stats?.tickets.total ?? 0} />
        <StatBox label="Done" value={stats?.tickets.done ?? 0} color="text-green-500" />
        <StatBox label="In Progress" value={stats?.tickets.inProgress ?? 0} color="text-yellow-500" />
        <StatBox label="To Do" value={stats?.tickets.todo ?? 0} color="text-blue-500" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sprints */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Sprints ({stats?.sprints.total ?? 0}, {stats?.sprints.active ?? 0} active)
          </h2>
          <div className="space-y-2">
            {sprints.slice(0, 10).map((s) => (
              <Link
                key={s.id}
                href={`/projects/${key}/sprints/${s.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent"
              >
                <span className="text-sm font-medium">{s.name}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                  s.state === 'active' ? 'bg-green-500/10 text-green-500' :
                  s.state === 'closed' ? 'bg-muted text-muted-foreground' :
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  {s.state}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Versions */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Versions ({stats?.versions.total ?? 0}, {stats?.versions.unreleased ?? 0} unreleased)
          </h2>
          <div className="space-y-2">
            {versions.slice(0, 10).map((v) => (
              <Link
                key={v.id}
                href={`/projects/${key}/versions/${v.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent"
              >
                <span className="text-sm font-medium">{v.name}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                  v.isReleased ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {v.isReleased ? 'Released' : 'Unreleased'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className={`text-2xl font-bold ${color ?? ''}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

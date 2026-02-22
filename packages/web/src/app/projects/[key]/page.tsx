'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { use } from 'react';
import type { ProjectStats, Sprint, Version } from '@/types/api';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { TicketCheck, CheckCircle2, Clock, ListTodo, Milestone, CalendarDays } from 'lucide-react';

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
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${key}: ${stats?.project?.name ?? ''}`}
        description={stats?.project?.description ?? undefined}
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: key },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Tickets" value={stats?.tickets.total ?? 0} icon={TicketCheck} />
        <StatCard label="Done" value={stats?.tickets.done ?? 0} icon={CheckCircle2} />
        <StatCard label="In Progress" value={stats?.tickets.inProgress ?? 0} icon={Clock} />
        <StatCard label="To Do" value={stats?.tickets.todo ?? 0} icon={ListTodo} />
      </div>

      {/* Sprints & Versions Tabs */}
      <Tabs defaultValue="sprints">
        <TabsList>
          <TabsTrigger value="sprints">
            Sprints ({stats?.sprints.total ?? 0})
          </TabsTrigger>
          <TabsTrigger value="versions">
            Versions ({stats?.versions.total ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sprints" className="mt-4">
          {sprints.length === 0 ? (
            <EmptyState icon={Milestone} title="No sprints" description="No sprints found for this project." />
          ) : (
            <div className="space-y-2">
              {sprints.map((s) => (
                <Link key={s.id} href={`/projects/${key}/sprints/${s.id}`}>
                  <Card className="transition-colors hover:bg-accent">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        {s.startDate && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(s.startDate).toLocaleDateString('vi-VN')}
                            {s.endDate && ` — ${new Date(s.endDate).toLocaleDateString('vi-VN')}`}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={s.state} />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="versions" className="mt-4">
          {versions.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No versions" description="No versions found for this project." />
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <Link key={v.id} href={`/projects/${key}/versions/${v.id}`}>
                  <Card className="transition-colors hover:bg-accent">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{v.name}</p>
                        {v.releaseDate && (
                          <p className="text-xs text-muted-foreground">
                            Release: {new Date(v.releaseDate).toLocaleDateString('vi-VN')}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={v.isReleased ? 'Released' : 'Unreleased'} />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

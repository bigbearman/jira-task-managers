'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import type { Project } from '@/types/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban } from 'lucide-react';

export default function ProjectsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: api.projects.list,
  });

  const projects: Project[] = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description={`${projects.length} projects synced`} />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Sync Jira data first to see your projects here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.jiraProjectKey}`}>
              <Card className="group transition-colors hover:bg-accent">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt="" className="h-10 w-10 rounded" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold group-hover:text-primary">
                        {p.jiraProjectKey}
                      </p>
                      <p className="text-sm text-muted-foreground">{p.name}</p>
                    </div>
                  </div>
                  {p.lead && (
                    <p className="mt-3 text-xs text-muted-foreground">Lead: {p.lead}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

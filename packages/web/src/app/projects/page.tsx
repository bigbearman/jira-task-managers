'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import type { Project } from '@/types/api';
import { FolderKanban } from 'lucide-react';

export default function ProjectsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: api.projects.list,
  });

  const projects: Project[] = data?.data ?? [];

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Projects</h1>

      {projects.length === 0 ? (
        <p className="text-muted-foreground">No projects found. Sync Jira data first.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.jiraProjectKey}`}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                {p.avatarUrl ? (
                  <img src={p.avatarUrl} alt="" className="h-10 w-10 rounded" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-semibold group-hover:text-primary">{p.jiraProjectKey}</p>
                  <p className="text-sm text-muted-foreground">{p.name}</p>
                </div>
              </div>
              {p.lead && (
                <p className="mt-3 text-xs text-muted-foreground">Lead: {p.lead}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

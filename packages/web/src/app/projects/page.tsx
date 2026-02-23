'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import type { Project } from '@/types/api';
import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban, Search } from 'lucide-react';

const PAGE_SIZE = 12;

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { page, search: debouncedSearch }],
    queryFn: () => api.projects.list({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined }),
  });

  const projects: Project[] = data?.data ?? [];
  const meta = data?.meta;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    // Simple debounce via timeout
    clearTimeout((globalThis as any).__projectSearchTimer);
    (globalThis as any).__projectSearchTimer = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full max-w-sm" />
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
      <PageHeader
        title="Projects"
        description={`${meta?.total ?? projects.length} projects synced`}
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={debouncedSearch ? 'No projects match your search' : 'No projects found'}
          description={debouncedSearch ? 'Try a different search term.' : 'Sync Jira data first to see your projects here.'}
        />
      ) : (
        <>
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

          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

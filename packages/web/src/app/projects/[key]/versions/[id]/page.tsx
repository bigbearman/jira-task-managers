'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { use } from 'react';
import type { Ticket } from '@/types/api';

export default function VersionDetailPage({ params }: { params: Promise<{ key: string; id: string }> }) {
  const { key, id } = use(params);

  const { data: versionData } = useQuery({
    queryKey: ['versions', id],
    queryFn: () => api.versions.get(id),
  });

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['versions', id, 'tickets'],
    queryFn: () => api.versions.tickets(id, 1, 50),
  });

  const version = versionData?.data;
  const tickets: Ticket[] = ticketsData?.data ?? [];

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Loading version...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/projects/${key}`} className="text-sm text-muted-foreground hover:underline">
          &larr; {key}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{version?.name ?? 'Version'}</h1>
        {version?.description && <p className="text-sm text-muted-foreground">{version.description}</p>}
        <div className="mt-2 flex gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${
            version?.isReleased ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
          }`}>
            {version?.isReleased ? 'Released' : 'Unreleased'}
          </span>
          {version?.releaseDate && (
            <span className="text-xs text-muted-foreground">
              {new Date(version.releaseDate).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="divide-y divide-border">
          {tickets.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No tickets in this version.</p>
          ) : (
            tickets.map((t) => (
              <Link
                key={t.id}
                href={`/tickets/${t.jiraTicketKey}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground">{t.jiraTicketKey}</span>
                  <span className="text-sm">{t.summary}</span>
                </div>
                <div className="flex items-center gap-2">
                  {t.assigneeDisplayName && (
                    <span className="text-xs text-muted-foreground">{t.assigneeDisplayName}</span>
                  )}
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                    ['Done', 'Closed', 'Resolved'].includes(t.status ?? '') ? 'bg-green-500/10 text-green-500' :
                    ['In Progress', 'Development'].includes(t.status ?? '') ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

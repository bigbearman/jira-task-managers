'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { JiraInstance } from '@/types/api';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['instances'],
    queryFn: api.instances.list,
  });

  const { data: syncLogs } = useQuery({
    queryKey: ['sync', 'logs'],
    queryFn: api.sync.logs,
  });

  const testMut = useMutation({
    mutationFn: (slug: string) => api.instances.test(slug),
  });

  const syncMut = useMutation({
    mutationFn: () => api.sync.trigger(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sync'] }),
  });

  const instances: JiraInstance[] = data?.data ?? [];
  const logs = syncLogs?.data ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Jira Instances */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Jira Instances</h2>
          <button
            onClick={() => syncMut.mutate()}
            disabled={syncMut.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncMut.isPending ? 'animate-spin' : ''}`} />
            Sync All
          </button>
        </div>

        {isLoading ? (
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        ) : instances.length === 0 ? (
          <p className="text-muted-foreground">No Jira instances configured. Add one via API.</p>
        ) : (
          <div className="space-y-3">
            {instances.map((inst) => (
              <div
                key={inst.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{inst.name}</p>
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs">{inst.slug}</span>
                    {inst.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{inst.baseUrl}</p>
                  {inst.lastSyncedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(inst.lastSyncedAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => testMut.mutate(inst.slug)}
                  disabled={testMut.isPending}
                  className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
                >
                  Test Connection
                </button>
              </div>
            ))}
          </div>
        )}

        {testMut.data && (
          <div className={`mt-3 rounded-lg p-3 text-sm ${
            testMut.data.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          }`}>
            {testMut.data.success ? 'Connection successful!' : 'Connection failed.'}
          </div>
        )}
      </section>

      {/* Sync Logs */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent Sync Logs</h2>
        <div className="rounded-xl border border-border bg-card">
          <div className="divide-y divide-border">
            {logs.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No sync logs.</p>
            ) : (
              logs.slice(0, 15).map((log: any) => (
                <div key={log.id} className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm">
                    <span className="mr-2 font-medium">{log.syncType}</span>
                    <span className="text-xs text-muted-foreground">
                      {log.itemsProcessed ?? 0} processed, {log.itemsCreated ?? 0} created, {log.itemsUpdated ?? 0} updated
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                      log.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                      log.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                      log.status === 'running' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {log.status}
                    </span>
                    {log.startedAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.startedAt).toLocaleString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

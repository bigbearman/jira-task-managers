'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { JiraInstance, SyncLog } from '@/types/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Pencil,
  Trash2,
  Plug,
  RefreshCw,
  CheckCircle,
  XCircle,
  Server,
  FileText,
} from 'lucide-react';

interface InstanceForm {
  name: string;
  slug: string;
  baseUrl: string;
  email: string;
  apiToken: string;
  syncEnabled: boolean;
  assignees: string;
  projectKeys: string;
}

const emptyForm: InstanceForm = {
  name: '',
  slug: '',
  baseUrl: '',
  email: '',
  apiToken: '',
  syncEnabled: true,
  assignees: '',
  projectKeys: '',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [form, setForm] = useState<InstanceForm>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['instances'],
    queryFn: api.instances.list,
  });

  const { data: syncLogs } = useQuery({
    queryKey: ['sync', 'logs'],
    queryFn: api.sync.logs,
  });

  const instances: JiraInstance[] = data?.data ?? [];
  const logs: SyncLog[] = syncLogs?.data ?? [];

  const createMut = useMutation({
    mutationFn: (body: Record<string, any>) => api.instances.create(body as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      setShowDialog(false);
      setForm(emptyForm);
      toast.success('Instance created');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create instance'),
  });

  const updateMut = useMutation({
    mutationFn: ({ slug, body }: { slug: string; body: Partial<InstanceForm> }) =>
      api.instances.update(slug, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      setShowDialog(false);
      setEditingSlug(null);
      setForm(emptyForm);
      toast.success('Instance updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update instance'),
  });

  const deleteMut = useMutation({
    mutationFn: (slug: string) => api.instances.delete(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      setDeleteSlug(null);
      toast.success('Instance deactivated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete instance'),
  });

  const testMut = useMutation({
    mutationFn: (slug: string) => api.instances.test(slug),
    onSuccess: (data) => {
      if (data?.success) {
        toast.success('Connection successful!');
      } else {
        toast.error('Connection failed');
      }
    },
    onError: () => toast.error('Connection test failed'),
  });

  const syncMut = useMutation({
    mutationFn: () => api.sync.trigger(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync'] });
      toast.success('Sync triggered for all instances');
    },
    onError: () => toast.error('Failed to trigger sync'),
  });

  const openCreate = () => {
    setEditingSlug(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (inst: JiraInstance) => {
    setEditingSlug(inst.slug);
    setForm({
      name: inst.name,
      slug: inst.slug,
      baseUrl: inst.baseUrl,
      email: inst.email,
      apiToken: '',
      syncEnabled: inst.syncEnabled,
      assignees: inst.assignees?.join(', ') ?? '',
      projectKeys: inst.projectKeys?.join(', ') ?? '',
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name || !form.baseUrl || !form.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    const assignees = form.assignees
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const projectKeys = form.projectKeys
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (editingSlug) {
      const body: any = { name: form.name, baseUrl: form.baseUrl, email: form.email, syncEnabled: form.syncEnabled, assignees, projectKeys };
      if (form.apiToken) body.apiToken = form.apiToken;
      updateMut.mutate({ slug: editingSlug, body });
    } else {
      if (!form.slug || !form.apiToken) {
        toast.error('Slug and API Token are required for new instances');
        return;
      }
      createMut.mutate({ ...form, assignees, projectKeys });
    }
  };

  const isEditing = editingSlug !== null;
  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage Jira instances and sync configuration" />

      <Tabs defaultValue="instances">
        <TabsList>
          <TabsTrigger value="instances">
            <Server className="mr-2 h-4 w-4" />
            Jira Instances
          </TabsTrigger>
          <TabsTrigger value="sync-logs">
            <FileText className="mr-2 h-4 w-4" />
            Sync Logs
          </TabsTrigger>
        </TabsList>

        {/* Instances Tab */}
        <TabsContent value="instances" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{instances.length} instance(s) configured</p>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Instance
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : instances.length === 0 ? (
            <EmptyState
              icon={Server}
              title="No Jira instances"
              description="Add your first Jira instance to start syncing projects and tickets."
              action={
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Instance
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {instances.map((inst) => (
                <Card key={inst.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{inst.name}</p>
                        <Badge variant="secondary">{inst.slug}</Badge>
                        {inst.isActive ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {inst.syncEnabled && (
                          <Badge variant="outline" className="text-xs">sync on</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{inst.baseUrl}</p>
                      {inst.projectKeys && inst.projectKeys.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">Projects:</span>
                          {inst.projectKeys.map((k) => (
                            <Badge key={k} variant="secondary" className="text-xs">
                              {k}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {inst.assignees && inst.assignees.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {inst.assignees.map((a) => (
                            <Badge key={a} variant="outline" className="text-xs">
                              {a}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {inst.lastSyncedAt && (
                        <p className="text-xs text-muted-foreground">
                          Last synced: {new Date(inst.lastSyncedAt).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testMut.mutate(inst.slug)}
                        disabled={testMut.isPending}
                      >
                        <Plug className="mr-1 h-3 w-3" />
                        Test
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(inst)}>
                        <Pencil className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteSlug(inst.slug)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sync Logs Tab */}
        <TabsContent value="sync-logs" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{logs.length} recent log(s)</p>
            <Button onClick={() => syncMut.mutate()} disabled={syncMut.isPending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncMut.isPending ? 'animate-spin' : ''}`} />
              Sync All
            </Button>
          </div>

          {logs.length === 0 ? (
            <EmptyState icon={FileText} title="No sync logs" description="Trigger a sync to see logs here." />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.slice(0, 20).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.syncType}</TableCell>
                      <TableCell>
                        <StatusBadge status={log.status} />
                      </TableCell>
                      <TableCell>{log.itemsProcessed ?? 0}</TableCell>
                      <TableCell>{log.itemsCreated ?? 0}</TableCell>
                      <TableCell>{log.itemsUpdated ?? 0}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {log.startedAt && new Date(log.startedAt).toLocaleString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Instance' : 'Add Jira Instance'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the connection details for this Jira instance.'
                : 'Connect a new Jira Cloud instance.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="My Jira Cloud"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    ...(!isEditing ? { slug: slugify(name) } : {}),
                  }));
                }}
              />
            </div>

            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  placeholder="my-jira-cloud"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL *</Label>
              <Input
                id="baseUrl"
                placeholder="https://yourteam.atlassian.net"
                value={form.baseUrl}
                onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                placeholder="user@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiToken">
                API Token {isEditing ? '(leave empty to keep current)' : '*'}
              </Label>
              <Input
                id="apiToken"
                type="password"
                placeholder={isEditing ? '********' : 'Enter API token'}
                value={form.apiToken}
                onChange={(e) => setForm((f) => ({ ...f, apiToken: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="syncEnabled">Auto Sync</Label>
              <Switch
                id="syncEnabled"
                checked={form.syncEnabled}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, syncEnabled: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignees">Assignees</Label>
              <Input
                id="assignees"
                placeholder="user1@email.com, user2@email.com"
                value={form.assignees}
                onChange={(e) => setForm((f) => ({ ...f, assignees: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated Jira emails. First sync only fetches active tickets assigned to these people.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectKeys">Project Keys</Label>
              <Input
                id="projectKeys"
                placeholder="PROJ, DEV, OPS"
                value={form.projectKeys}
                onChange={(e) => setForm((f) => ({ ...f, projectKeys: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated Jira project keys to sync. Leave empty to sync all projects.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSlug} onOpenChange={() => setDeleteSlug(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Instance?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the Jira instance &quot;{deleteSlug}&quot;. It can be reactivated
              later. Synced data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteSlug && deleteMut.mutate(deleteSlug)}
            >
              {deleteMut.isPending ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { use, useState } from 'react';
import { toast } from 'sonner';
import type { Ticket, AiAnalysis, GitOperation, TaskAction } from '@/types/api';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain,
  Check,
  X,
  RotateCcw,
  GitBranch,
  ExternalLink,
  Clock,
  MessageSquare,
} from 'lucide-react';

export default function TicketDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params);
  const queryClient = useQueryClient();
  const [approach, setApproach] = useState('');
  const [showApproachInput, setShowApproachInput] = useState(false);

  const { data: ticketData, isLoading } = useQuery({
    queryKey: ['tickets', key],
    queryFn: () => api.tickets.get(key),
  });

  const { data: aiData } = useQuery({
    queryKey: ['tickets', key, 'ai-analysis'],
    queryFn: () => api.tickets.aiAnalysis(key),
  });

  const { data: gitData } = useQuery({
    queryKey: ['tickets', key, 'git-status'],
    queryFn: () => api.tickets.gitStatus(key),
  });

  const { data: actionsData } = useQuery({
    queryKey: ['tickets', key, 'actions'],
    queryFn: () => api.tickets.actions(key),
  });

  const { data: commentsData } = useQuery({
    queryKey: ['tickets', key, 'comments'],
    queryFn: () => api.tickets.comments(key),
  });

  const ticket: Ticket | undefined = ticketData?.data;
  const aiAnalyses: AiAnalysis[] = aiData?.data ? (Array.isArray(aiData.data) ? aiData.data : [aiData.data]) : [];
  const gitOps: GitOperation[] = gitData?.data ?? [];
  const actions: TaskAction[] = actionsData?.data ?? [];
  const comments = commentsData?.data ?? [];

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['tickets', key] });
  };

  const analyzeMut = useMutation({
    mutationFn: () => api.taskActions.analyze(key),
    onSuccess: () => { invalidateAll(); toast.success('Analysis queued'); },
    onError: () => toast.error('Failed to start analysis'),
  });

  const approveMut = useMutation({
    mutationFn: () => api.taskActions.approve(key, { approach }),
    onSuccess: () => { invalidateAll(); setShowApproachInput(false); toast.success('Approved! Code flow started.'); },
    onError: () => toast.error('Failed to approve'),
  });

  const rejectMut = useMutation({
    mutationFn: () => api.taskActions.reject(key),
    onSuccess: () => { invalidateAll(); toast.success('Ticket rejected'); },
    onError: () => toast.error('Failed to reject'),
  });

  const unrejectMut = useMutation({
    mutationFn: () => api.taskActions.unreject(key),
    onSuccess: () => { invalidateAll(); toast.success('Ticket unrejected'); },
    onError: () => toast.error('Failed to unreject'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-96" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return <p className="text-destructive">Ticket not found.</p>;
  }

  const latestPr = gitOps.find((op) => op.operationType === 'pr_create' && op.prUrl);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`${ticket.jiraTicketKey}: ${ticket.summary}`}
        breadcrumbs={[
          { label: 'Tickets', href: '/tickets' },
          { label: ticket.jiraTicketKey },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => analyzeMut.mutate()} disabled={analyzeMut.isPending}>
              <Brain className="mr-2 h-4 w-4" />
              {analyzeMut.isPending ? 'Analyzing...' : 'Analyze'}
            </Button>
            <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-500/10" onClick={() => setShowApproachInput(!showApproachInput)}>
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button variant="destructive" onClick={() => rejectMut.mutate()} disabled={rejectMut.isPending}>
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button variant="outline" onClick={() => unrejectMut.mutate()} disabled={unrejectMut.isPending}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Unreject
            </Button>
          </div>
        }
      />

      {/* Ticket Meta */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary">{ticket.issueType}</Badge>
        <StatusBadge status={ticket.status} />
        {ticket.priority && <Badge variant="outline">{ticket.priority}</Badge>}
        {ticket.assigneeDisplayName && (
          <span className="text-sm text-muted-foreground">Assignee: {ticket.assigneeDisplayName}</span>
        )}
        {ticket.storyPoints && (
          <span className="text-sm text-muted-foreground">SP: {ticket.storyPoints}</span>
        )}
        {ticket.labels?.length ? (
          <span className="text-sm text-muted-foreground">Labels: {ticket.labels.join(', ')}</span>
        ) : null}
      </div>

      {/* Approve approach input */}
      {showApproachInput && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label>Approach / Instructions</Label>
            <Textarea
              value={approach}
              onChange={(e) => setApproach(e.target.value)}
              placeholder="Describe the approach for code changes..."
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={() => approveMut.mutate()} disabled={approveMut.isPending} className="bg-green-600 hover:bg-green-700">
                {approveMut.isPending ? 'Starting flow...' : 'Confirm Approve'}
              </Button>
              <Button variant="outline" onClick={() => setShowApproachInput(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Description + Comments */}
        <div className="space-y-6 lg:col-span-2">
          {ticket.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {ticket.description}
                </div>
              </CardContent>
            </Card>
          )}

          {comments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4" /> Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {comments.slice(0, 10).map((c: any) => (
                  <div key={c.id} className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{c.authorDisplayName}</span>
                      <span>{c.jiraCreatedAt && new Date(c.jiraCreatedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="mt-1 text-sm">{c.body?.substring(0, 300)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* AI Analysis Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Brain className="h-4 w-4" /> AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiAnalyses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No analysis yet. Click Analyze to start.</p>
              ) : (
                <div className="space-y-3">
                  {aiAnalyses.slice(0, 3).map((a) => (
                    <div key={a.id} className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <StatusBadge status={a.status} />
                        <span className="text-muted-foreground">{a.model}</span>
                      </div>
                      {a.response && (
                        <p className="mt-2 text-xs whitespace-pre-wrap">{a.response.substring(0, 500)}</p>
                      )}
                      {a.durationMs && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {(a.durationMs / 1000).toFixed(1)}s
                          {a.costUsd && ` · $${a.costUsd}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Git Status Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <GitBranch className="h-4 w-4" /> Git Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gitOps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No git operations yet.</p>
              ) : (
                <div className="space-y-2">
                  {latestPr && (
                    <a
                      href={latestPr.prUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      PR #{latestPr.prNumber}
                    </a>
                  )}
                  {gitOps.slice(0, 5).map((op) => (
                    <div key={op.id} className="flex items-center justify-between text-xs">
                      <span>{op.operationType.replace(/_/g, ' ')}</span>
                      <StatusBadge status={op.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Action History</CardTitle>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No actions yet.</p>
              ) : (
                <div className="space-y-2">
                  {actions.slice(0, 10).map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">{a.actionType}</Badge>
                        <span className="text-muted-foreground">{a.triggeredBy}</span>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

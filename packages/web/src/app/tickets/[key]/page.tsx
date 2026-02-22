'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { use, useState } from 'react';
import type { Ticket, AiAnalysis, GitOperation, TaskAction } from '@/types/api';
import {
  Brain,
  Check,
  X,
  RotateCcw,
  Pencil,
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
    onSuccess: invalidateAll,
  });

  const approveMut = useMutation({
    mutationFn: () => api.taskActions.approve(key, { approach }),
    onSuccess: () => { invalidateAll(); setShowApproachInput(false); },
  });

  const rejectMut = useMutation({
    mutationFn: () => api.taskActions.reject(key),
    onSuccess: invalidateAll,
  });

  const unrejectMut = useMutation({
    mutationFn: () => api.taskActions.unreject(key),
    onSuccess: invalidateAll,
  });

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Loading ticket...</div>;
  }

  if (!ticket) {
    return <p className="text-destructive">Ticket not found.</p>;
  }

  const latestPr = gitOps.find((op) => op.operationType === 'pr_create' && op.prUrl);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium">{ticket.issueType}</span>
          <span className="text-sm text-muted-foreground">{ticket.priority}</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold">{ticket.jiraTicketKey}: {ticket.summary}</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>Status: <strong className="text-foreground">{ticket.status}</strong></span>
          {ticket.assigneeDisplayName && <span>Assignee: {ticket.assigneeDisplayName}</span>}
          {ticket.storyPoints && <span>SP: {ticket.storyPoints}</span>}
          {ticket.labels?.length ? <span>Labels: {ticket.labels.join(', ')}</span> : null}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => analyzeMut.mutate()}
          disabled={analyzeMut.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Brain className="h-4 w-4" />
          {analyzeMut.isPending ? 'Analyzing...' : 'Analyze'}
        </button>
        <button
          onClick={() => setShowApproachInput(!showApproachInput)}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Check className="h-4 w-4" />
          Approve
        </button>
        <button
          onClick={() => rejectMut.mutate()}
          disabled={rejectMut.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          Reject
        </button>
        <button
          onClick={() => unrejectMut.mutate()}
          disabled={unrejectMut.isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          Unreject
        </button>
      </div>

      {/* Approve approach input */}
      {showApproachInput && (
        <div className="rounded-xl border border-border bg-card p-4">
          <label className="text-sm font-medium">Approach / Instructions</label>
          <textarea
            value={approach}
            onChange={(e) => setApproach(e.target.value)}
            placeholder="Describe the approach for code changes..."
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            rows={4}
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => approveMut.mutate()}
              disabled={approveMut.isPending}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {approveMut.isPending ? 'Starting flow...' : 'Confirm Approve'}
            </button>
            <button
              onClick={() => setShowApproachInput(false)}
              className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Description + Comments */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          {ticket.description && (
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 text-sm font-semibold">Description</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                {ticket.description}
              </div>
            </section>
          )}

          {/* Comments */}
          {comments.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="h-4 w-4" /> Comments ({comments.length})
              </h2>
              <div className="space-y-3">
                {comments.slice(0, 10).map((c: any) => (
                  <div key={c.id} className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{c.authorDisplayName}</span>
                      <span>{c.jiraCreatedAt && new Date(c.jiraCreatedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="mt-1 text-sm">{c.body?.substring(0, 300)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: AI Panel + Git Status + Actions */}
        <div className="space-y-6">
          {/* AI Analysis Panel */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Brain className="h-4 w-4" /> AI Analysis
            </h2>
            {aiAnalyses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No analysis yet. Click Analyze to start.</p>
            ) : (
              <div className="space-y-3">
                {aiAnalyses.slice(0, 3).map((a) => (
                  <div key={a.id} className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`rounded px-1.5 py-0.5 font-medium ${
                        a.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                        a.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                        'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {a.status}
                      </span>
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
          </section>

          {/* Git Status Panel */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <GitBranch className="h-4 w-4" /> Git Status
            </h2>
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
                    <span className={`rounded px-1.5 py-0.5 font-medium ${
                      op.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                      op.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                      'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {op.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Action History */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-sm font-semibold">Action History</h2>
            {actions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No actions yet.</p>
            ) : (
              <div className="space-y-2">
                {actions.slice(0, 10).map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="mr-1 rounded bg-secondary px-1.5 py-0.5 font-medium">
                        {a.actionType}
                      </span>
                      <span className="text-muted-foreground">{a.triggeredBy}</span>
                    </div>
                    <span className={`rounded px-1.5 py-0.5 font-medium ${
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
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

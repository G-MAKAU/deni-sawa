'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Bot, CheckCircle2, ExternalLink, MessageSquare, XCircle } from 'lucide-react';
import { adminFetch, adminPut } from '@/lib/admin-client';
import { AdminCard, EmptyState, ErrorBanner, Loading, StatusPill, type StatusTone } from '@/components/admin/ui';
import { useConfirm } from '@/components/admin/confirm';
import { cn } from '@/lib/utils';

interface AdminComment {
  id: string;
  parent_id: string | null;
  post_id: string | null;
  post_title: string;
  post_slug: string | null;
  author_name: string;
  author_email: string;
  author_website: string | null;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  ai_moderated: boolean;
  moderation_verdict: string | null;
  moderation_reasons: string[];
  moderation_model: string | null;
}

interface Counts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

const FILTERS: { key: Filter; label: string; tone: StatusTone }[] = [
  { key: 'pending', label: 'Pending', tone: 'amber' },
  { key: 'approved', label: 'Approved', tone: 'green' },
  { key: 'rejected', label: 'Rejected', tone: 'red' },
  { key: 'all', label: 'All', tone: 'grey' },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'C';
}

function hueFor(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CommentsModerationClient() {
  const confirm = useConfirm();

  const [filter, setFilter] = React.useState<Filter>('pending');
  const [comments, setComments] = React.useState<AdminComment[]>([]);
  const [counts, setCounts] = React.useState<Counts>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = React.useState<boolean | null>(null);
  const [aiToggling, setAiToggling] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await adminFetch<{ settings: { comments?: { aiModerationEnabled?: boolean } } }>('/api/admin/settings');
        setAiEnabled(data.settings.comments?.aiModerationEnabled ?? true);
      } catch {
        setAiEnabled(true);
      }
    })();
  }, []);

  const toggleAi = async () => {
    setAiToggling(true);
    try {
      const next = aiEnabled === false;
      await adminPut('/api/admin/settings', { settings: { COMMENT_AI_MODERATION_ENABLED: next ? 'true' : 'false' } });
      setAiEnabled(next);
      toast.success(next ? 'AI moderation enabled' : 'AI moderation disabled — comments will wait for manual review');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update AI moderation setting');
    } finally {
      setAiToggling(false);
    }
  };

  const load = React.useCallback(async (target: Filter = filter) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (target !== 'all') params.set('status', target);
      const data = await adminFetch<{ comments: AdminComment[]; counts: Counts }>(`/api/admin/blog/comments?${params.toString()}`);
      setComments(data.comments ?? []);
      setCounts(data.counts ?? { pending: 0, approved: 0, rejected: 0, total: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchFilter = (next: Filter) => {
    setFilter(next);
    void load(next);
  };

  const setStatus = async (comment: AdminComment, status: AdminComment['status']) => {
    setBusyId(comment.id);
    try {
      await adminFetch<{ comment: AdminComment }>('/api/admin/blog/comments', { method: 'PATCH', body: JSON.stringify({ id: comment.id, status }) });
      setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, status } : c)));
      if (filter !== 'all' && filter !== status) {
        setComments((prev) => prev.filter((c) => c.id !== comment.id));
      }
      setCounts((prev) => {
        const next: Counts = { ...prev };
        next[comment.status] = Math.max(0, next[comment.status] - 1);
        next[status] = next[status] + 1;
        return next;
      });
      toast.success(status === 'approved' ? 'Comment approved' : 'Comment rejected');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update comment');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (comment: AdminComment) => {
    try {
      const ok = await confirm({
        title: 'Delete comment',
        message: `Delete this comment by ${comment.author_name}? This cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
        action: async () => {
          await adminFetch(`/api/admin/blog/comments?id=${encodeURIComponent(comment.id)}`, { method: 'DELETE' });
        },
      });
      if (!ok) return;
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      setCounts((prev) => {
        const next: Counts = { ...prev };
        next[comment.status] = Math.max(0, next[comment.status] - 1);
        next.total = Math.max(0, next.total - 1);
        return next;
      });
      toast.success('Comment deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete comment');
    }
  };

  return (
    <div className="space-y-4">
      <AdminCard
        title="Moderate Comments"
        subtitle="Review, approve, reject or remove reader comments on published posts."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void toggleAi()}
              disabled={aiToggling || aiEnabled === null}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50',
                aiEnabled
                  ? 'bg-[#5A9E28]/10 text-[#5A9E28] hover:bg-[#5A9E28]/20'
                  : 'border border-[var(--a-border)] text-[var(--a-muted)] hover:text-[#E8510A]'
              )}
              title="Moderate new comments automatically with AI on submit"
            >
              <Bot className="h-3.5 w-3.5" />
              AI moderation: {aiEnabled ? 'On' : 'Off'}
            </button>
            {FILTERS.map((item) => {
              const count = item.key === 'all' ? counts.total : counts[item.key];
              const active = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => switchFilter(item.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                    active ? 'bg-[#E8510A] text-white' : 'border border-[var(--a-border)] text-[var(--a-text)] hover:border-[#E8510A]/40 hover:text-[#E8510A]'
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                      active ? 'bg-white/20 text-white' : item.key === 'pending' ? 'bg-amber-500/15 text-amber-700' : 'bg-[var(--a-subtle)] text-[var(--a-muted)]'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        }
        bodyClassName="p-0"
      >
        {error && (
          <div className="p-4">
            <ErrorBanner message={error} />
          </div>
        )}

        {loading ? (
          <Loading label="Loading comments…" />
        ) : comments.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title={filter === 'pending' ? 'Nothing to moderate' : 'No comments here'}
              description={
                filter === 'pending'
                  ? 'You are all caught up — new comments appear here as soon as they are submitted.'
                  : 'No comments match this filter.'
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--a-border-soft)]">
            {comments.map((comment) => (
              <div key={comment.id} className="flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-[var(--a-subtle)] sm:flex-row">
                <div className="flex shrink-0 gap-3 sm:w-44 sm:flex-col sm:gap-1">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                    style={{ backgroundColor: `hsl(${hueFor(comment.author_name)} 60% 45%)` }}
                  >
                    {initials(comment.author_name)}
                  </span>
                  <div className="min-w-0 sm:pt-1">
                    <p className="truncate text-[13px] font-bold text-[var(--a-ink2)]">{comment.author_name}</p>
                    <a
                      href={`mailto:${comment.author_email}`}
                      className="block truncate text-[11px] text-[var(--a-muted)] transition-colors hover:text-[#E8510A]"
                    >
                      {comment.author_email}
                    </a>
                    {comment.author_website && (
                      <a
                        href={/^https?:\/\//i.test(comment.author_website) ? comment.author_website : `https://${comment.author_website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-[11px] text-[var(--a-muted)] transition-colors hover:text-[#E8510A]"
                      >
                        Website ↗
                      </a>
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--a-text)]">{comment.content}</p>
                  {comment.ai_moderated && comment.moderation_reasons.length > 0 && (
                    <div className="mt-2 rounded-md border border-[var(--a-border)] bg-[var(--a-subtle)] px-2.5 py-1.5 text-[11px] text-[var(--a-muted)]">
                      <span className="inline-flex items-center gap-1 font-semibold text-[var(--a-ink2)]">
                        <Bot className="h-3 w-3 text-[#E8510A]" /> AI verdict: {comment.moderation_verdict ?? 'review'}
                      </span>
                      <span className="ml-1.5">— {comment.moderation_reasons.join(' · ')}</span>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--a-muted)]">
                    <span>{formatDate(comment.created_at)}</span>
                    {comment.post_slug ? (
                      <Link
                        href={`/about/blog/${comment.post_slug}#comments`}
                        target="_blank"
                        className="inline-flex items-center gap-1 font-semibold text-[var(--a-ink2)] transition-colors hover:text-[#E8510A]"
                      >
                        <MessageSquare className="h-3 w-3" />
                        {comment.post_title}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    ) : (
                      <span>{comment.post_title}</span>
                    )}
                    <StatusPill tone={comment.status === 'pending' ? 'amber' : comment.status === 'approved' ? 'green' : 'red'}>
                      {comment.status}
                    </StatusPill>
                  </div>
                </div>

                <div className="flex shrink-0 items-start gap-2">
                  {comment.status !== 'approved' && (
                    <button
                      type="button"
                      disabled={busyId === comment.id}
                      onClick={() => void setStatus(comment, 'approved')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#5A9E28] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#4d8820] disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  )}
                  {comment.status !== 'rejected' && (
                    <button
                      type="button"
                      disabled={busyId === comment.id}
                      onClick={() => void setStatus(comment, 'rejected')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 py-2 text-xs font-bold text-[var(--a-text)] transition-colors hover:border-amber-500/40 hover:text-amber-700 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === comment.id}
                    onClick={() => void remove(comment)}
                    className="rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 py-2 text-xs font-bold text-[var(--a-text)] transition-colors hover:border-red-500/40 hover:text-red-600 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}

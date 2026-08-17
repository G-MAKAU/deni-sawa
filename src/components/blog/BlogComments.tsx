'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Send, CheckCircle2, Quote } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PublicComment {
  id: string;
  parent_id: string | null;
  author_name: string;
  author_website: string | null;
  content: string;
  created_at: string;
}

function formatCommentDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function CommentCard({ comment }: { comment: PublicComment }) {
  const avatarHue = useHueFromString(comment.author_name);

  return (
    <div className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:border-brand/25 hover:shadow-card">
      <div className="flex items-start gap-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, hsl(${avatarHue} 65% 45%), hsl(${(avatarHue + 40) % 360} 70% 38%))` }}
        >
          {initials(comment.author_name) || 'G'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-foreground">
              {comment.author_website ? (
                <a
                  href={/^https?:\/\//i.test(comment.author_website) ? comment.author_website : `https://${comment.author_website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-brand"
                >
                  {comment.author_name}
                </a>
              ) : (
                comment.author_name
              )}
            </span>
            <time className="text-xs text-muted-foreground">{formatCommentDate(comment.created_at)}</time>
          </div>
          <p className="mt-2.5 whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">
            {comment.content}
          </p>
        </div>
      </div>
    </div>
  );
}

function useHueFromString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export function BlogComments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [repliedTo, setRepliedTo] = useState<PublicComment | null>(null);

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/blog/comments?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name,
          email,
          website,
          content,
          parentId: repliedTo?.id ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to submit your comment');
        return;
      }
      toast.success(data.message ?? 'Comment submitted');
      setSubmitted(true);
      setName('');
      setEmail('');
      setWebsite('');
      setContent('');
      setRepliedTo(null);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="comments" className="mt-12">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <MessageSquare className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
            Comments <span className="text-brand">({comments.length})</span>
          </h3>
          <p className="text-sm text-muted-foreground">Join the conversation — share your thoughts below.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
          <Quote className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts.</p>
        </div>
      )}

      <div className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="mb-6">
          <h4 className="font-heading text-lg font-bold text-foreground">Leave a Comment</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Your email address will not be published. Required fields are marked <span className="text-brand">*</span>.
          </p>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center rounded-2xl border border-growth/20 bg-growth/5 px-6 py-10 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-growth/10 text-growth">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h5 className="font-heading text-lg font-bold text-foreground">Thank you!</h5>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Your comment has been submitted and is awaiting moderation. It will appear here once approved.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-6 text-xs font-semibold text-brand underline-offset-2 hover:underline"
            >
              Write another comment
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {repliedTo && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
                <p className="text-sm text-foreground/85">
                  Replying to <span className="font-semibold text-brand">{repliedTo.author_name}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setRepliedTo(null)}
                  className="text-xs font-semibold text-muted-foreground hover:text-brand"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Name <span className="text-brand">*</span>
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Wanjiru"
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Email <span className="text-brand">*</span>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Website (optional)</span>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Comment <span className="text-brand">*</span>
              </span>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder="Share your thoughts on this article…"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </label>

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                Be kind, respectful and on-topic. Comments are moderated.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-brand-sm transition-all duration-300',
                  'hover:bg-brand-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
                )}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? 'Posting…' : 'Post Comment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
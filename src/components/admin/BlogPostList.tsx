'use client';

import { useMemo, useState } from 'react';
import { Plus, Search, Star, Trash2, ChevronRight, FileText } from 'lucide-react';
import { type AdminPost, type PostStatus } from './types';
import { cn } from '@/lib/utils';

const statusStyles: Record<PostStatus, { label: string; classes: string; dot: string }> = {
  draft: { label: 'Draft', classes: 'bg-ink-100/70 text-ink-600 dark:bg-ink-700/60 dark:text-ink-300', dot: 'bg-ink-400' },
  review: { label: 'In Review', classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', dot: 'bg-amber-400' },
  scheduled: { label: 'Scheduled', classes: 'bg-sky-500/10 text-sky-600 dark:text-sky-400', dot: 'bg-sky-400' },
  published: { label: 'Published', classes: 'bg-green/10 text-green-700 dark:text-green', dot: 'bg-green' },
  archived: { label: 'Archived', classes: 'bg-red-500/10 text-red-600 dark:text-red-400', dot: 'bg-red-400' },
};

interface BlogPostListProps {
  posts: AdminPost[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function BlogPostList({ posts, selectedId, onSelect, onNew, onDelete }: BlogPostListProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | PostStatus>('all');

  const filtered = useMemo(() => {
    let list = posts;
    if (status !== 'all') list = list.filter((p) => p.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
    }
    return list;
  }, [posts, search, status]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: posts.length };
    for (const p of posts) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [posts]);

  const filters: { key: 'all' | PostStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'published', label: 'Published' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-ink-200 px-4 py-3 dark:border-ink-800">
        <h2 className="font-heading text-sm font-bold text-ink-900 dark:text-ink-100">Blog Posts</h2>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-brand-600 active:scale-95"
        >
          <Plus size={12} /> New
        </button>
      </div>

      <div className="border-b border-ink-200 px-4 py-3 dark:border-ink-800">
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-lg border border-ink-200 bg-ink-25 py-2 pl-9 pr-3 text-xs text-ink-800 placeholder-ink-400 focus:border-brand/50 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatus(f.key)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                status === f.key
                  ? 'bg-brand text-white'
                  : 'bg-ink-100 text-ink-500 hover:text-ink-800 dark:bg-ink-800 dark:text-ink-400 dark:hover:text-ink-200'
              )}
            >
              {f.label}
              <span className="ml-1 opacity-70">{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <FileText size={28} className="mb-3 text-ink-300" />
            <p className="text-xs text-ink-400">No posts found. Create your first article.</p>
          </div>
        ) : (
          filtered.map((post) => {
            const st = statusStyles[post.status] ?? statusStyles.draft;
            const active = post.id === selectedId;
            return (
              <div
                key={post.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(post.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(post.id);
                  }
                }}
                className={cn(
                  'group w-full cursor-pointer border-b border-ink-200 px-4 py-3 text-left transition-colors focus:outline-none focus-visible:bg-brand/5 dark:border-ink-800',
                  active ? 'bg-brand/10 dark:bg-brand/10' : 'hover:bg-ink-25 dark:hover:bg-ink-800/60'
                )}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span className="line-clamp-1 text-[13px] font-semibold text-ink-900 dark:text-ink-100">
                    {post.title || 'Untitled Post'}
                  </span>
                  <ChevronRight size={13} className="mt-0.5 flex-shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold', st.classes)}>
                    <span className={cn('h-1 w-1 rounded-full', st.dot)} />
                    {st.label}
                  </span>
                  {post.isFeatured && <Star size={11} className="fill-brand text-brand" />}
                  {post.categoryName && <span>{post.categoryName}</span>}
                  <span className="ml-auto">{formatDate(post.updatedAt)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-400">
                  <span>{post.authorName || 'Unassigned'}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
                    className="ml-auto flex items-center gap-1 text-ink-400 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                    title="Delete post"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
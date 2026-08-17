'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/browser';
import { BlogPostList } from './BlogPostList';
import { BlogPostEditor } from './BlogPostEditor';
import { type AdminPost, type Author, type Category, type AdminIdentity } from './types';
import { useConfirm } from '@/components/admin/confirm';
import { cn } from '@/lib/utils';

type AuthState = 'loading' | 'signedOut' | 'authorized' | 'forbidden';

function getEmbeddedField<T extends Record<string, unknown>>(
  embedded: T | T[] | null | undefined,
  field: keyof T
): string | undefined {
  if (!embedded) return undefined;
  if (Array.isArray(embedded)) return embedded[0]?.[field] as string | undefined;
  return embedded[field] as string | undefined;
}

export function BlogCMSClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const confirm = useConfirm();

  const [authState, setAuthState] = useState<AuthState>('loading');
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'editor' | 'settings'>('posts');
  const POST_PAGE_SIZE = 10;
  const [postPage, setPostPage] = useState(1);
  const [postTotal, setPostTotal] = useState(0);
  const [postPages, setPostPages] = useState(1);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const selectedPost = posts.find((p) => p.id === selectedPostId) ?? null;

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, [supabase]);

  const loadAdminAndData = useCallback(async () => {
    setError(null);

    const token = await getToken();
    if (!token) {
      setAuthState('signedOut');
      setLoading(false);
      return;
    }

    try {
      const meRes = await fetch('/api/admin/me', { headers: { Authorization: `Bearer ${token}` } });
      if (meRes.status === 401 || meRes.status === 403) {
        await supabase.auth.signOut();
        setAuthState('signedOut');
        return;
      }
      if (!meRes.ok) throw new Error('Failed to verify admin session');

      const { admin: me } = await meRes.json();
      setAdmin(me);
      setAuthState('authorized');

      await Promise.all([loadPosts(), loadAuthors(), loadCategories()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the blog dashboard');
      setAuthState('signedOut');
    } finally {
      setLoading(false);
    }
  }, [getToken, supabase]);

  useEffect(() => {
    loadAdminAndData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPosts = useCallback(
    async (page = 1) => {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`/api/admin/blog/posts?page=${page}&limit=${POST_PAGE_SIZE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch posts');
      }

      const { posts: data, pagination } = await response.json();

      const formatted: AdminPost[] = (data ?? []).map((p: Record<string, unknown>) => ({
        id: String(p.id),
        title: String(p.title ?? ''),
        slug: String(p.slug ?? ''),
        excerpt: (p.excerpt as string) || '',
        status: (p.status as AdminPost['status']) ?? 'draft',
        isFeatured: Boolean(p.featured),
        authorName: getEmbeddedField(p.author as Record<string, unknown>, 'full_name') || 'Unassigned',
        categoryName: getEmbeddedField(p.category as Record<string, unknown>, 'name') || 'Uncategorized',
        publishedAt: (p.published_at as string | null) ?? null,
        updatedAt: String(p.updated_at ?? new Date().toISOString()),
        featuredImageUrl: (p.cover_image_url as string | null) ?? null,
        authorId: (p.author_id as string | null) ?? undefined,
        categoryId: (p.primary_category_id as string | null) ?? undefined,
        contentMarkdown: (p.content_markdown as string) ?? '',
        contentHtml: (p.content_html as string | null) ?? '',
        contentLexical: (p.content_lexical as Record<string, unknown> | null) ?? null,
        readingMinutes: (p.reading_minutes as number | null) ?? undefined,
        seoTitle: (p.seo_title as string | null) ?? '',
        seoDescription: (p.seo_description as string | null) ?? '',
        seoKeywords: (p.seo_keywords as string | null) ?? '',
      }));

      setPosts(formatted);
      setPostTotal(pagination?.total ?? formatted.length);
      setPostPages(Math.max(1, pagination?.pages ?? 1));
      setPostPage(Math.min(page, Math.max(1, pagination?.pages ?? 1)));
    },
    [getToken]
  );

  const loadAuthors = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    const response = await fetch('/api/admin/blog/authors', { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return;
    const { authors: data } = await response.json();
    setAuthors(data ?? []);
  }, [getToken]);

  const loadCategories = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    const response = await fetch('/api/admin/blog/categories', { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return;
    const { categories: data } = await response.json();
    setCategories(data ?? []);
  }, [getToken]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      await loadAdminAndData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please check your credentials.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthState('signedOut');
    setAdmin(null);
    setPosts([]);
    setSelectedPostId(null);
    setIsCreating(false);
  };

  const handleNewPost = () => {
    setSelectedPostId(null);
    setIsCreating(true);
    setActiveTab('editor');
  };

  const handleSelectPost = (id: string) => {
    const post = posts.find((p) => p.id === id);
    setSelectedPostId(id);
    setIsCreating(false);
    setActiveTab('editor');
  };

  const handleDelete = async (id: string) => {
    try {
      const ok = await confirm({
        message: 'Delete this post? This cannot be undone.',
        action: async () => {
          const token = await getToken();
          if (!token) throw new Error('Session expired. Please sign in again.');
          const response = await fetch(`/api/admin/blog/posts/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to delete post');
          }
        },
      });
      if (!ok) return;

      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (selectedPostId === id) {
        setSelectedPostId(null);
        setIsCreating(false);
        setActiveTab('posts');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete post');
    }
  };

  const handleSave = async (data: Partial<AdminPost> & { id?: string }) => {
    const isUpdate = Boolean(data.id && posts.find((p) => p.id === data.id));
    const token = await getToken();
    if (!token) throw new Error('Session expired. Please sign in again.');

    const response = await fetch(
      isUpdate ? `/api/admin/blog/posts/${data.id}` : '/api/admin/blog/posts',
      {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save post');
    }

    await loadPosts(postPage);
    if (!isUpdate) {
      setIsCreating(false);
    }
  };

  const handleUploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'png';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from('deni_sawa').upload(path, file, {
      contentType: file.type,
      cacheControl: '3600',
    });

    if (uploadError) {
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from('deni_sawa').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const showEditor = Boolean(selectedPost || isCreating);

  /* ── Auth screens ───────────────────────────────────────────────────────── */
  if (authState === 'loading') {
    return (
      <div className="flex h-[calc(100vh-220px)] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (authState === 'forbidden') {
    return (
      <div className="flex h-[calc(100vh-220px)] flex-col items-center justify-center gap-4">
        <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
          <h2 className="mb-2 font-heading text-xl font-bold">Not Authorized</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Your account is not configured for the Deni Sawa blog dashboard.
          </p>
          <button onClick={handleSignOut} className="btn-brand text-sm">Sign out</button>
        </div>
      </div>
    );
  }

  if (authState === 'signedOut') {
    return (
      <div className="flex min-h-[calc(100vh-220px)] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-4xl border border-border bg-card p-8 shadow-soft sm:p-10">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <LockIcon />
            </div>
            <h1 className="font-heading text-2xl font-extrabold">Blog Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with your Deni Sawa staff account to manage articles.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@denisawa.co.ke"
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={signingIn}
              className="btn-brand w-full text-sm"
            >
              {signingIn ? <Loader /> : null}
              {signingIn ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Dashboard ──────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div>
          <p className="text-xs text-[var(--a-muted)]">Signed in as</p>
          <p className="text-sm font-bold text-[var(--a-ink2)]">
            {admin?.full_name ?? admin?.email}
            <span className="ml-2 rounded-full bg-[#E8510A]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c94508]">
              {admin?.role}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/about/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3.5 py-2 text-xs font-semibold text-[var(--a-text)] transition-colors hover:border-[#E8510A]/40 hover:text-[#E8510A]"
          >
            View site blog
          </a>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3.5 py-2 text-xs font-semibold text-[var(--a-text)] transition-colors hover:border-red-500/40 hover:text-red-600"
          >
            Sign out
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Tabs */}
      <div className="inline-flex rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] p-1">
        {(
          [
            { key: 'posts', label: 'Posts' },
            { key: 'editor', label: 'Editor' },
            { key: 'settings', label: 'Settings' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'rounded-md px-5 py-2 text-[13px] font-semibold transition-colors',
              activeTab === tab.key ? 'bg-[#E8510A] text-white' : 'text-[var(--a-text2)] hover:text-[var(--a-ink2)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-[var(--a-border)] bg-[var(--a-card)]">
          <Loader />
        </div>
      ) : activeTab === 'posts' ? (
        <div className="max-h-[72vh] overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <BlogPostList
            posts={posts}
            selectedId={selectedPostId}
            onSelect={handleSelectPost}
            onNew={handleNewPost}
            onDelete={handleDelete}
          />
          {postPages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--a-border-soft)] px-4 py-3">
              <p className="text-xs text-[var(--a-muted)]">
                {postTotal.toLocaleString()} post{postTotal === 1 ? '' : 's'} · page {postPage} of {postPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={postPage <= 1}
                  onClick={() => loadPosts(postPage - 1)}
                  className="rounded-md border border-[var(--a-border)] px-3 py-1.5 text-xs font-semibold text-[var(--a-text)] hover:border-[#E8510A]/40 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={postPage >= postPages}
                  onClick={() => loadPosts(postPage + 1)}
                  className="rounded-md border border-[var(--a-border)] px-3 py-1.5 text-xs font-semibold text-[var(--a-text)] hover:border-[#E8510A]/40 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : showEditor ? (
        <div className="h-[calc(125vh-110px)] min-h-[700px] overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <BlogPostEditor
            key={selectedPost?.id ?? 'new'}
            post={selectedPost}
            authors={authors}
            categories={categories}
            onSave={handleSave}
            onUploadImage={handleUploadImage}
            view={activeTab === 'settings' ? 'settings' : 'editor'}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--a-border)] bg-[var(--a-card)]">
          <EmptyState onNew={handleNewPost} />
        </div>
      )}
    </div>
  );
}

function Loader() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      Loading...
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-25 dark:bg-ink-800">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-500">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      </div>
      <p className="mb-1 text-base font-bold">No post selected</p>
      <p className="mb-4 text-sm text-muted-foreground">
        Select a post from the list, or create a new one to start writing.
      </p>
      <button onClick={onNew} className="btn-brand text-sm">
        Create new post
      </button>
    </div>
  );
}
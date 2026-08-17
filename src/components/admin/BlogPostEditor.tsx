'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Save, Star, StarOff, ChevronDown, X, Loader2, Eye, Tag, User, FolderOpen, CheckCircle2,
} from 'lucide-react';
import { LexicalEditor } from '@/features/lexical/LexicalEditor';
import { htmlToLexicalState } from '@/features/lexical/htmlToState';
import { lexicalToHtml } from '@/lib/lexical-to-html';
import { lexicalToPlainText } from '@/lib/lexical-to-plaintext';
import { BlogContentRenderer } from '@/components/blog/BlogContentRenderer';
import { toast } from 'sonner';
import { StoragePickerModal, type PickerFile } from '@/components/admin/storage/StoragePickerModal';
import { type AdminPost, type Author, type Category, type PostStatus } from './types';
import { cn } from '@/lib/utils';

interface BlogPostEditorProps {
  post: AdminPost | null;
  authors: Author[];
  categories: Category[];
  onSave: (data: Partial<AdminPost> & { id?: string }) => Promise<void> | void;
  onUploadImage: (file: File) => Promise<string>;
  /** Which top-level tab is active — drives what the editor body shows. */
  view: 'editor' | 'settings';
}

function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const statusOptions: { value: PostStatus; label: string; color: string; dot: string }[] = [
  { value: 'draft', label: 'Draft', color: 'text-ink-500', dot: 'bg-ink-400' },
  { value: 'review', label: 'In Review', color: 'text-amber-500', dot: 'bg-amber-400' },
  { value: 'scheduled', label: 'Scheduled', color: 'text-sky-500', dot: 'bg-sky-400' },
  { value: 'published', label: 'Published', color: 'text-green', dot: 'bg-green' },
  { value: 'archived', label: 'Archived', color: 'text-red-500', dot: 'bg-red-400' },
];

const FIELD_INPUT =
  'w-full rounded-lg border border-ink-200 bg-[var(--a-subtle)] px-3 py-2 text-sm text-ink-800 placeholder-ink-400 focus:border-brand/50 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100';

export function BlogPostEditor({ post, authors, categories, onSave, onUploadImage, view }: BlogPostEditorProps) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [status, setStatus] = useState<PostStatus>(post?.status ?? 'draft');
  const [isFeatured, setIsFeatured] = useState(post ? post.isFeatured : true);
  const [authorId, setAuthorId] = useState(post?.authorId ?? '');
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? '');
  const [featuredImage, setFeaturedImage] = useState<string | null>(post?.featuredImageUrl ?? null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [showSEO, setShowSEO] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [subTab, setSubTab] = useState<'write' | 'preview'>('write');
  const [isSaving, setIsSaving] = useState(false);
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? '');
  const [seoKeywords, setSeoKeywords] = useState(post?.seoKeywords ?? '');
  const [savedFlash, setSavedFlash] = useState(false);

  // Storage picker
  const browseResolveRef = React.useRef<((url: string | null) => void) | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'featured' | 'content'>('featured');

  const openBrowse = React.useCallback((target: 'featured' | 'content') => {
    return new Promise<string | null>((resolve) => {
      setPickerTarget(target);
      browseResolveRef.current = resolve;
      setPickerOpen(true);
    });
  }, []);

  const handlePickerClose = React.useCallback(() => {
    browseResolveRef.current?.(null);
    browseResolveRef.current = null;
    setPickerOpen(false);
  }, []);

  const handlePickerPick = React.useCallback((file: PickerFile) => {
    browseResolveRef.current?.(file.publicUrl);
    browseResolveRef.current = null;
    setPickerOpen(false);
  }, []);

  // Rich editor state
  const [lexicalState, setLexicalState] = useState<Record<string, unknown> | null>(null);
  const [htmlContent, setHtmlContent] = useState(post?.contentHtml ?? '');
  const [plainText, setPlainText] = useState(post?.contentMarkdown ?? '');
  // Tracks which post's content has actually been converted and mounted into
  // the Lexical editor, so switching posts never shows stale/empty content.
  const [editorReadyId, setEditorReadyId] = useState<string | null>(null);

  // Load the existing post content into the Lexical editor. The exact stored
  // Lexical state is preferred (lossless); content_html is only a fallback for
  // legacy posts saved before content_lexical existed.
  useEffect(() => {
    let cancelled = false;
    setEditorReadyId(null);
    (async () => {
      const state = post?.contentLexical ?? (await htmlToLexicalState(post?.contentHtml ?? ''));
      if (cancelled) return;
      setLexicalState(state);
      setEditorReadyId(post?.id ?? 'new');
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  const handleEditorChange = (state: unknown) => {
    const next = state as Record<string, unknown>;
    setLexicalState(next);
    setHtmlContent(lexicalToHtml(next));
    setPlainText(lexicalToPlainText(next));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slugManuallyEdited) setSlug(slugify(val));
  };

  const estimateReadingMinutes = useCallback(() => {
    const words = (plainText || htmlContent.replace(/<[^>]*>/g, ' ')).trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [plainText, htmlContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const author = authors.find((a) => a.id === authorId);
      const category = categories.find((c) => c.id === categoryId);
      const finalSlug = slug.trim() || slugify(title);

      await Promise.resolve(
        onSave({
          id: post?.id,
          title: title.trim(),
          slug: finalSlug,
          excerpt,
          status,
          isFeatured,
          authorId,
          categoryId,
          authorName: author?.full_name ?? '',
          categoryName: category?.name ?? '',
          featuredImageUrl: featuredImage,
          contentMarkdown: plainText,
          contentHtml: htmlContent,
          contentLexical: lexicalState,
          readingMinutes: estimateReadingMinutes(),
          seoTitle,
          seoDescription,
          seoKeywords,
          publishedAt: status === 'published' ? new Date().toISOString() : post?.publishedAt ?? null,
          updatedAt: new Date().toISOString(),
        })
      );
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
      toast.success(post?.id ? 'Post saved' : 'Post created');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save the post.';
      toast.error(`Save failed — ${message}`);
      console.error('Blog save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const currentStatus = statusOptions.find((s) => s.value === status)!;

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-ink-200 bg-[var(--a-card)] px-4 py-3 dark:border-ink-800 dark:bg-ink-900 sm:px-5 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-400">
            Title <span className="text-brand">*</span>
          </label>
          <input
            type="text"
            placeholder="Post title..."
            value={title}
            onChange={handleTitleChange}
            className="w-full bg-transparent text-lg font-bold text-ink-800 placeholder-ink-400 focus:outline-none dark:text-ink-100 dark:placeholder-ink-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={cn(
                'flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-25 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-ink-100 dark:border-ink-700 dark:bg-ink-800 dark:hover:bg-ink-700',
                currentStatus.color
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', currentStatus.dot)} />
              {currentStatus.label}
              <ChevronDown size={11} />
            </button>
            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-32 rounded-lg border border-ink-200 bg-[var(--a-card)] py-1 shadow-xl dark:border-ink-700 dark:bg-ink-800">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setStatus(opt.value); setShowStatusDropdown(false); }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors hover:bg-ink-25 dark:hover:bg-ink-700',
                        opt.color,
                        status === opt.value ? 'opacity-100' : 'opacity-60'
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', opt.dot)} />
                      {opt.label}
                      {status === opt.value && <span className="ml-auto">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving || !title.trim()}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-1.5 text-sm font-bold text-white transition-all hover:bg-brand-600 active:scale-95',
              (isSaving || !title.trim()) && 'opacity-60'
            )}
          >
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : savedFlash ? <CheckCircle2 size={13} /> : <Save size={13} />}
            {isSaving ? 'Saving...' : savedFlash ? 'Saved' : status === 'published' ? 'Publish' : 'Save'}
          </button>
        </div>
      </div>

      {/* Body */}
      {view === 'settings' ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--a-card)] p-4 dark:bg-ink-950 sm:p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {/* Publishing */}
            <div className="rounded-lg border border-ink-200 bg-[var(--a-card)] p-5 dark:border-ink-800">
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-ink-500">Publishing</h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    URL Slug <span className="text-brand">*</span>
                  </label>
                  <div className="flex items-center gap-1 rounded-lg border border-ink-200 bg-[var(--a-subtle)] px-3 py-2 dark:border-ink-700 dark:bg-ink-800">
                    <span className="shrink-0 text-xs text-ink-400">/about/blog/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => { setSlug(slugify(e.target.value)); setSlugManuallyEdited(true); }}
                      className="min-w-0 flex-1 bg-transparent text-sm text-ink-800 focus:outline-none dark:text-ink-100"
                      placeholder="post-slug"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    <User size={11} /> Author <span className="text-brand">*</span>
                  </label>
                  <select
                    value={authorId}
                    onChange={(e) => setAuthorId(e.target.value)}
                    className={FIELD_INPUT}
                  >
                    <option value="">Select author...</option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>{a.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    <FolderOpen size={11} /> Category <span className="text-brand">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={FIELD_INPUT}
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    <Star size={11} /> Featured
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsFeatured(!isFeatured)}
                    className={cn(
                      'flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                      isFeatured
                        ? 'border-brand/40 bg-brand/10 text-brand'
                        : 'border-ink-200 bg-[var(--a-subtle)] text-ink-500 hover:border-brand/40 dark:border-ink-700'
                    )}
                  >
                    {isFeatured ? <Star size={14} className="fill-brand text-brand" /> : <StarOff size={14} />}
                    {isFeatured ? 'Featured' : 'Not featured'}
                  </button>
                </div>
              </div>
            </div>

            {/* Summary & Media */}
            <div className="rounded-lg border border-ink-200 bg-[var(--a-card)] p-5 dark:border-ink-800">
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-ink-500">Summary & Media</h3>
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Excerpt</label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={4}
                    placeholder="Short summary shown on the blog cards..."
                    className={cn(FIELD_INPUT, 'resize-none')}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Featured Image URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={featuredImage ?? ''}
                      onChange={(e) => setFeaturedImage(e.target.value.trim() || null)}
                      placeholder="https://... or browse storage"
                      className={FIELD_INPUT}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const url = await openBrowse('featured');
                        if (url) setFeaturedImage(url);
                      }}
                      title="Browse storage"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/10"
                    >
                      <FolderOpen size={13} /> Browse
                    </button>
                  </div>
                  {featuredImage && (
                    <div className="relative mt-2 overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={featuredImage} alt="Featured post image" className="h-40 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFeaturedImage(null)}
                        className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white transition-colors hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-800">
              <button
                type="button"
                onClick={() => setShowSEO(!showSEO)}
                className="flex w-full items-center justify-between bg-[var(--a-subtle)] px-4 py-3 transition-colors hover:bg-[var(--a-hover)]"
              >
                <span className="flex items-center gap-2">
                  <Tag size={12} className="text-ink-500" />
                  <span className="text-xs font-semibold text-ink-600 dark:text-ink-300">SEO Settings</span>
                </span>
                <ChevronDown size={12} className={cn('text-ink-400 transition-transform', showSEO && 'rotate-180')} />
              </button>
              {showSEO && (
                <div className="space-y-3 border-t border-ink-200 p-4 dark:border-ink-800">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">SEO Title</label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      maxLength={70}
                      placeholder="Override title for search engines..."
                      className={cn(FIELD_INPUT, 'text-xs')}
                    />
                    <p className="mt-1 text-[10px] text-ink-400">{seoTitle.length}/70 characters</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">Meta Description</label>
                    <textarea
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      maxLength={160}
                      rows={3}
                      placeholder="Brief description for search results..."
                      className={cn(FIELD_INPUT, 'resize-none text-xs')}
                    />
                    <p className="mt-1 text-[10px] text-ink-400">{seoDescription.length}/160 characters</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">Keywords</label>
                    <input
                      type="text"
                      value={seoKeywords}
                      onChange={(e) => setSeoKeywords(e.target.value)}
                      placeholder="debt, coaching, nairobi..."
                      className={cn(FIELD_INPUT, 'text-xs')}
                    />
                    <p className="mt-1 text-[10px] text-ink-400">Comma-separated keywords</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Write / Preview toggle */}
          <div className="flex items-center gap-1 border-b border-ink-200 bg-[var(--a-subtle)] px-4 py-2 dark:border-ink-800 dark:bg-ink-900/50 sm:px-5">
            <button
              type="button"
              onClick={() => setSubTab('write')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                subTab === 'write' ? 'bg-ink-800 text-white dark:bg-ink-700' : 'text-ink-500 hover:text-ink-700 dark:text-ink-400'
              )}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setSubTab('preview')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                subTab === 'preview' ? 'bg-ink-800 text-white dark:bg-ink-700' : 'text-ink-500 hover:text-ink-700 dark:text-ink-400'
              )}
            >
              <Eye size={11} /> Preview
            </button>
            <span className="ml-auto truncate text-[10px] text-ink-400">
              /about/blog/{slug || 'post-slug'} · {plainText.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          {/* Full-width editor / preview */}
          <div className="min-h-0 flex-1 overflow-hidden bg-[var(--a-card)] p-4 dark:bg-ink-950 sm:p-6">
            {subTab === 'write' ? (
              editorReadyId === (post?.id ?? 'new') ? (
                <LexicalEditor
                  key={editorReadyId}
                  state={lexicalState ?? undefined}
                  onChange={handleEditorChange}
                  onUploadImage={onUploadImage}
                  onBrowseImage={() => openBrowse('content')}
                  placeholder="Start writing your article…"
                  fillHeight
                  className="min-h-0"
                />
              ) : (
                <div className="flex h-full min-h-[420px] items-center justify-center gap-2 text-sm text-ink-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading content…
                </div>
              )
            ) : (
              <div className="h-full overflow-y-auto">
                <BlogContentRenderer
                  html={htmlContent}
                  className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 lg:p-12"
                  emptyState={
                    <p className="italic text-muted-foreground">No content yet — switch to Write to add content.</p>
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}

      <StoragePickerModal open={pickerOpen} onClose={handlePickerClose} onPick={handlePickerPick} />
    </form>
  );
}

'use client';

import React, { useCallback, useState } from 'react';
import {
  Save, Eye, Star, StarOff, ChevronDown, X, Loader2, Tag, User, FolderOpen, CheckCircle2,
} from 'lucide-react';
import { LexicalEditor } from './LexicalEditor';
import { type AdminPost, type Author, type Category, type PostStatus } from './types';
import { cn } from '@/lib/utils';

interface BlogPostEditorProps {
  post: AdminPost | null;
  authors: Author[];
  categories: Category[];
  onSave: (data: Partial<AdminPost> & { id?: string }) => Promise<void> | void;
  onUploadImage: (file: File) => Promise<string>;
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

export function BlogPostEditor({ post, authors, categories, onSave, onUploadImage }: BlogPostEditorProps) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [status, setStatus] = useState<PostStatus>(post?.status ?? 'draft');
  const [isFeatured, setIsFeatured] = useState(post ? post.isFeatured : true);
  const [authorId, setAuthorId] = useState(post?.authorId ?? '');
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? '');
  const [htmlContent, setHtmlContent] = useState(post?.contentHtml ?? '');
  const [markdownContent] = useState(post?.contentMarkdown ?? '');
  const [featuredImage, setFeaturedImage] = useState<string | null>(post?.featuredImageUrl ?? null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [showSEO, setShowSEO] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isSaving, setIsSaving] = useState(false);
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? '');
  const [seoKeywords, setSeoKeywords] = useState(post?.seoKeywords ?? '');
  const [savedFlash, setSavedFlash] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slugManuallyEdited) setSlug(slugify(val));
  };

  const estimateReadingMinutes = useCallback(() => {
    const text =
      markdownContent && markdownContent.trim().length > 0
        ? markdownContent
        : htmlContent.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [htmlContent, markdownContent]);

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
          contentMarkdown: markdownContent,
          contentHtml: htmlContent,
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
    } finally {
      setIsSaving(false);
    }
  };

  const currentStatus = statusOptions.find((s) => s.value === status)!;

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-ink-200 bg-white px-4 py-3 dark:border-ink-800 dark:bg-ink-900 sm:px-5 lg:flex-row lg:items-center">
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
          <button
            type="button"
            onClick={() => setIsFeatured(!isFeatured)}
            className={cn(
              'rounded-lg p-2 transition-colors',
              isFeatured ? 'bg-brand/15 text-brand' : 'text-ink-400 hover:bg-brand/10 hover:text-brand'
            )}
            title={isFeatured ? 'Remove from featured' : 'Mark as featured'}
          >
            {isFeatured ? <Star size={15} className="fill-brand text-brand" /> : <StarOff size={15} />}
          </button>

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
                <div className="absolute right-0 top-full z-20 mt-1 min-w-32 rounded-lg border border-ink-200 bg-white py-1 shadow-xl dark:border-ink-700 dark:bg-ink-800">
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Editor column */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-1 border-b border-ink-200 bg-ink-25 px-4 py-2 dark:border-ink-800 dark:bg-ink-900/50 sm:px-5">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                activeTab === 'write'
                  ? 'bg-ink-800 text-white dark:bg-ink-700'
                  : 'text-ink-500 hover:text-ink-700 dark:text-ink-400'
              )}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                activeTab === 'preview'
                  ? 'bg-ink-800 text-white dark:bg-ink-700'
                  : 'text-ink-500 hover:text-ink-700 dark:text-ink-400'
              )}
            >
              <Eye size={11} /> Preview
            </button>
            <div className="ml-auto flex items-center gap-1 truncate text-[10px] text-ink-400">
              <span className="truncate">/{slug || 'post-slug'}</span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-ink-950">
            {activeTab === 'write' ? (
              <div className="flex h-full min-h-0 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <LexicalEditor initialContent={htmlContent} onChange={setHtmlContent} onUploadImage={onUploadImage} />
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                <article
                  className="prose max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html:
                      htmlContent ||
                      '<p class="italic text-ink-400">No content yet — switch to the Write tab to add content.</p>',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full shrink-0 overflow-y-auto border-t border-ink-200 bg-ink-25 scrollbar-thin dark:border-ink-800 dark:bg-ink-900/50 lg:w-72 lg:border-l lg:border-t-0">
          <div className="space-y-5 p-4">
            {/* Slug */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                URL Slug <span className="text-brand">*</span>
              </label>
              <div className="flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-2 dark:border-ink-700 dark:bg-ink-800">
                <span className="shrink-0 text-xs text-ink-400">/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(slugify(e.target.value)); setSlugManuallyEdited(true); }}
                  className="min-w-0 flex-1 bg-transparent text-xs text-ink-800 focus:outline-none dark:text-ink-100"
                  placeholder="post-slug"
                />
              </div>
            </div>

            {/* Author */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <User size={10} /> Author <span className="text-brand">*</span>
              </label>
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-800 focus:border-brand/50 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
              >
                <option value="">Select author...</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>{a.full_name}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <FolderOpen size={10} /> Category <span className="text-brand">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-800 focus:border-brand/50 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Excerpt */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                placeholder="Short summary shown on the blog cards..."
                className="w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-800 placeholder-ink-400 focus:border-brand/50 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
              />
            </div>

            {/* Featured image */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                Featured Image URL
              </label>
              <input
                type="url"
                value={featuredImage ?? ''}
                onChange={(e) => setFeaturedImage(e.target.value.trim() || null)}
                placeholder="https://..."
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-800 placeholder-ink-400 focus:border-brand/50 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
              />
              {featuredImage && (
                <div className="relative mt-2 overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
                  <img src={featuredImage} alt="Featured post image" className="h-32 w-full object-cover" />
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

            {/* SEO */}
            <div className="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-800">
              <button
                type="button"
                onClick={() => setShowSEO(!showSEO)}
                className="flex w-full items-center justify-between bg-ink-100 px-3 py-2.5 transition-colors hover:bg-ink-100/80 dark:bg-ink-800/60"
              >
                <span className="flex items-center gap-2">
                  <Tag size={12} className="text-ink-500" />
                  <span className="text-xs font-semibold text-ink-600 dark:text-ink-300">SEO Settings</span>
                </span>
                <ChevronDown size={12} className={cn('text-ink-400 transition-transform', showSEO && 'rotate-180')} />
              </button>

              {showSEO && (
                <div className="space-y-3 border-t border-ink-200 p-3 dark:border-ink-800">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      maxLength={70}
                      placeholder="Override title for search engines..."
                      className="w-full rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs text-ink-800 placeholder-ink-400 focus:border-brand/50 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
                    />
                    <p className="mt-1 text-[10px] text-ink-400">{seoTitle.length}/70 characters</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                      Meta Description
                    </label>
                    <textarea
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      maxLength={160}
                      rows={3}
                      placeholder="Brief description for search results..."
                      className="w-full resize-none rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs text-ink-800 placeholder-ink-400 focus:border-brand/50 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
                    />
                    <p className="mt-1 text-[10px] text-ink-400">{seoDescription.length}/160 characters</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                      Keywords
                    </label>
                    <input
                      type="text"
                      value={seoKeywords}
                      onChange={(e) => setSeoKeywords(e.target.value)}
                      placeholder="debt, coaching, nairobi..."
                      className="w-full rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs text-ink-800 placeholder-ink-400 focus:border-brand/50 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
                    />
                    <p className="mt-1 text-[10px] text-ink-400">Comma-separated keywords</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
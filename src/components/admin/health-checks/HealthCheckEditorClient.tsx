'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FileDown, FileText, FolderOpen, Image as ImageIcon, Loader2, Save, X } from 'lucide-react';
import { adminDownload, adminFetch, adminPut } from '@/lib/admin-client';
import { AdminCard, AsyncButton, ErrorBanner, Field, Loading, PageHeader, Toggle } from '@/components/admin/ui';
import { StorageImagePicker } from '@/components/admin/StorageImagePicker';
import { isReservedHealthCheckSlug } from '@/lib/health-check-slugs';

interface CheckDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  estimated_minutes: number | null;
  tags: string[];
  is_active: boolean;
  sort_order: number;
  section_count: number;
  detailed_price: number | null;
  detailed_call_price: number | null;
}

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20';

function makeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function HealthCheckEditorClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [exporting, setExporting] = React.useState<'pdf' | 'word' | null>(null);

  const [check, setCheck] = React.useState<CheckDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [slugTouched, setSlugTouched] = React.useState(false);

  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [estimatedMinutes, setEstimatedMinutes] = React.useState<string>('');
  const [tags, setTags] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);
  const [sortOrder, setSortOrder] = React.useState<string>('0');
  const [detailedPrice, setDetailedPrice] = React.useState<string>('');
  const [detailedCallPrice, setDetailedCallPrice] = React.useState<string>('');
  const [imagePickerOpen, setImagePickerOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { check: row } = await adminFetch<{ check: CheckDetail }>(`/api/admin/health-checks/${id}`);
        if (cancelled) return;
        setCheck(row);
        setName(row.name);
        setSlug(row.slug);
        setDescription(row.description ?? '');
        setImageUrl(row.image_url ?? '');
        setEstimatedMinutes(row.estimated_minutes?.toString() ?? '');
        setTags(row.tags.join(', '));
        setIsActive(row.is_active);
        setSortOrder(row.sort_order.toString());
        setDetailedPrice(row.detailed_price?.toString() ?? '');
        setDetailedCallPrice(row.detailed_call_price?.toString() ?? '');
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load health check.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) return <ErrorBanner message={error} />;
  if (!check) return <Loading label="Loading health check…" />;

  const slugLocked = isReservedHealthCheckSlug(check.slug);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    try {
      await adminPut(`/api/admin/health-checks/${id}`, {
        name: name.trim(),
        slug: slugLocked ? undefined : slugTouched ? slug.trim() : undefined,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : null,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        is_active: isActive,
        sort_order: Number(sortOrder || 0),
        detailed_price: detailedPrice ? Number(detailedPrice) : 0,
        detailed_call_price: detailedCallPrice ? Number(detailedCallPrice) : 0,
      });
      toast.success('Health check saved');
      setSlugTouched(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save health check.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'word') => {
    setExporting(format);
    try {
      const safeSlug = slug.trim() || 'health-check';
      await adminDownload(
        `/api/admin/health-checks/${id}/export?format=${format}`,
        `${safeSlug}-questions.${format === 'pdf' ? 'pdf' : 'docx'}`
      );
      toast.success(`${format === 'pdf' ? 'PDF' : 'Word'} downloaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <PageHeader
        title={check.name}
        subtitle="Edit the check's public details."
        crumbs={[{ label: 'Health Checks', href: '/admin/health-checks' }, { label: check.name }]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                disabled={exporting !== null}
                title="Download questions as PDF"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-[12px] font-semibold text-[var(--a-text)] transition-colors hover:border-[#5A9E28]/40 hover:text-[#3f7a1a] disabled:opacity-50"
              >
                {exporting === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                Questions PDF
              </button>
              <button
                type="button"
                onClick={() => handleExport('word')}
                disabled={exporting !== null}
                title="Download questions as Word"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-[12px] font-semibold text-[var(--a-text)] transition-colors hover:border-[#5A9E28]/40 hover:text-[#3f7a1a] disabled:opacity-50"
              >
                {exporting === 'word' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                Questions Word
              </button>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/admin/health-checks/${id}/questions`)}
              className="h-9 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3.5 text-[13px] font-semibold text-[var(--a-text)] hover:border-[#E8510A]/40 hover:text-[#E8510A]"
            >
              Manage questions
            </button>
            <AsyncButton
              onClick={handleSave}
              loading={saving}
              loadingLabel="Saving…"
              label="Save changes"
              icon={<Save className="h-4 w-4" />}
              size="sm"
            />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AdminCard title="Details" subtitle="Public information shown on the intro page.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" required>
                <input className={INPUT_CLASS} value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched && !slugLocked) setSlug(makeSlug(e.target.value)); }} />
              </Field>
              <Field
                label="URL slug"
                hint={
                  slugLocked
                    ? `Locked — used on the public site at /${check.slug}.`
                    : 'Leave to auto-generate from the name.'
                }
              >
                <div className="relative">
                  <input
                    className={`${INPUT_CLASS} font-mono ${slugLocked ? 'cursor-not-allowed opacity-60' : ''}`}
                    value={slug}
                    disabled={slugLocked}
                    onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
                  />
                  {slugLocked && (
                    <span className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-md bg-[var(--a-subtle)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--a-muted)]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      Locked
                    </span>
                  )}
                </div>
              </Field>
              <Field label="Estimated minutes" className="sm:col-span-2">
                <input
                  className={INPUT_CLASS}
                  type="number"
                  min={1}
                  max={600}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder="15"
                />
              </Field>
              <Field label="Tags" hint="Comma-separated assessment areas, e.g. Financial, Cashflow." className="sm:col-span-2">
                <input className={INPUT_CLASS} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Financial, Operations, Governance" />
              </Field>
              <Field
                label="Cover image"
                hint="Select an image from storage — shown on the public intro page."
                className="sm:col-span-2"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-28 w-44 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)]">
                    {imageUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="Health check cover" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          title="Remove image"
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#111111]/70 text-white transition-colors hover:bg-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--a-placeholder)]">
                        <ImageIcon className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setImagePickerOpen(true)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3.5 text-[13px] font-semibold text-[var(--a-text)] transition-colors hover:border-[#E8510A]/40 hover:text-[#E8510A]"
                    >
                      <FolderOpen className="h-4 w-4" /> Browse storage
                    </button>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-left text-xs font-medium text-red-600 hover:underline"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 py-3 text-sm focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short summary shown on the health check intro page…"
                />
              </Field>
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Publishing">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--a-ink2)]">Active</p>
                  <p className="text-xs text-[var(--a-muted)]">Visible to visitors</p>
                </div>
                <Toggle checked={isActive} onChange={setIsActive} label="Active" />
              </div>
              <div className="h-px bg-[var(--a-border-soft)]" />
              <Field label="Sort order">
                <input className={INPUT_CLASS} type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
              </Field>
            </div>
          </AdminCard>

          <AdminCard
            title="Pricing (KES)"
            subtitle="Charged when visitors choose a paid report type."
          >
            <div className="space-y-4">
              <Field label="Detailed report price" hint="Shown to visitors as the paid Detailed option.">
                <input
                  className={INPUT_CLASS}
                  type="number"
                  min={0}
                  step="0.01"
                  value={detailedPrice}
                  onChange={(e) => setDetailedPrice(e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Detailed + Advisory Call price" hint="Requires the visitor's WhatsApp number.">
                <input
                  className={INPUT_CLASS}
                  type="number"
                  min={0}
                  step="0.01"
                  value={detailedCallPrice}
                  onChange={(e) => setDetailedCallPrice(e.target.value)}
                  placeholder="0"
                />
              </Field>
              <p className="text-xs text-[var(--a-muted)]">
                Set to 0 to hide the paid option and offer only the free summary.
              </p>
            </div>
          </AdminCard>

          <AdminCard title="Sections">
            <div className="space-y-2 text-sm text-[var(--a-text2)]">
              <p>
                <span className="font-semibold text-[var(--a-ink2)]">{check.section_count}</span> sections currently configured.
              </p>
              <Link href={`/admin/health-checks/${id}/sections`} className="inline-block font-semibold text-[#E8510A] hover:underline">
                Manage sections & subsections →
              </Link>
              <Link href={`/admin/health-checks/${id}/prompts`} className="block font-semibold text-[#E8510A] hover:underline">
                Edit AI report prompts →
              </Link>
              <Link href={`/admin/health-checks/${id}/rate-limits`} className="block font-semibold text-[#E8510A] hover:underline">
                Configure rate limits →
              </Link>
              <Link href={`/admin/health-checks/${id}/delivery`} className="block font-semibold text-[#E8510A] hover:underline">
                Delivery overview →
              </Link>
            </div>
          </AdminCard>
        </div>
      </div>

      <StorageImagePicker
        open={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onSelect={(publicUrl) => {
          setImageUrl(publicUrl);
          setImagePickerOpen(false);
        }}
      />
    </>
  );
}

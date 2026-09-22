'use client';

import * as React from 'react';
import { Plus, Edit, Trash2, Clock, DollarSign, Loader2, SlidersHorizontal, Sparkles } from 'lucide-react';
import { adminFetch, adminPost, adminPut, adminDelete } from '@/lib/admin-client';
import { ErrorBanner, Loading, PageHeader, StatusPill, Modal, Toggle, EmptyState, AsyncButton } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

interface Service {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  allow_custom_amount: boolean;
  created_at: string;
}

type ServiceForm = Omit<Service, 'id' | 'created_at'>;

const EMPTY_FORM: ServiceForm = {
  name: '',
  slug: '',
  description: '',
  short_description: '',
  price: 0,
  duration_minutes: 30,
  is_active: true,
  allow_custom_amount: false,
};

function formatPrice(value: number): string {
  return `KES ${Number(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function ServicesClient() {
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(null);
  const [form, setForm] = React.useState<ServiceForm>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState<Service | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ services: Service[] }>('/api/admin/bookings/services');
      setServices(data.services ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setSlugManuallyEdited(false);
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (svc: Service) => {
    setEditingService(svc);
    setForm({
      name: svc.name,
      slug: svc.slug,
      description: svc.description,
      short_description: svc.short_description,
      price: svc.price,
      duration_minutes: svc.duration_minutes,
      is_active: svc.is_active,
      allow_custom_amount: svc.allow_custom_amount,
    });
    setSlugManuallyEdited(true);
    setSaveError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSaveError(null);
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugManuallyEdited ? prev.slug : slugify(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setForm((prev) => ({ ...prev, slug: value }));
  };

  const handleSave = async () => {
    const trimmedName = form.name.trim();
    const trimmedSlug = form.slug.trim();

    if (!trimmedName || !trimmedSlug) {
      setSaveError('Name and slug are required.');
      return;
    }
    if (form.price < 0) {
      setSaveError('Price must be a positive number.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    const payload = { ...form, name: trimmedName, slug: trimmedSlug };

    try {
      if (editingService) {
        await adminPut('/api/admin/bookings/services', { ...payload, id: editingService.id });
      } else {
        await adminPost('/api/admin/bookings/services', payload);
      }
      await load();
      closeModal();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save service.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDelete(`/api/admin/bookings/services?id=${deleteTarget.id}`);
      await load();
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete service.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const inputCls =
    'h-9 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-sm text-[var(--a-ink)] placeholder-[var(--a-muted)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20';

  return (
    <>
      <PageHeader
        title="Booking Services"
        subtitle="Manage the services customers can book."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Bookings', href: '/admin/bookings' }, { label: 'Services' }]}
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8510A] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#c94508]"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        }
      />

      {error && <ErrorBanner message={error} className="mb-4" />}

      {loading ? (
        <Loading label="Loading services…" />
      ) : services.length === 0 ? (
        <EmptyState
          title="No services yet"
          description="Add your first booking service to get started."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8510A] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#c94508]"
            >
              <Plus className="h-4 w-4" />
              Add Service
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="group flex flex-col rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="font-heading text-base font-semibold text-[var(--a-ink2)] leading-snug">
                  {svc.name}
                </h3>
                <StatusPill tone={svc.is_active ? 'green' : 'grey'}>
                  {svc.is_active ? 'Active' : 'Inactive'}
                </StatusPill>
              </div>

              {svc.short_description && (
                <p className="mb-4 text-sm text-[var(--a-muted)] leading-relaxed line-clamp-2">
                  {svc.short_description}
                </p>
              )}

              <div className="mt-auto flex items-center gap-4 text-sm">
                {svc.allow_custom_amount ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-[#E8510A]">
                    <Sparkles className="h-3.5 w-3.5" />
                    From {formatPrice(svc.price)}
                    <span className="ml-1 inline-flex items-center rounded-full border border-[#E8510A]/25 bg-[#E8510A]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#E8510A]">
                      Custom Amount
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-[#E8510A]">
                    <DollarSign className="h-3.5 w-3.5" />
                    {formatPrice(svc.price)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[var(--a-muted)]">
                  <Clock className="h-3.5 w-3.5" />
                  {svc.duration_minutes} min
                </span>
              </div>

              <div className="mt-4 flex items-center gap-1 border-t border-[var(--a-border-soft)] pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(svc)}
                  className="rounded-md p-1.5 text-[var(--a-muted)] transition-colors hover:bg-[var(--a-subtle)] hover:text-[#E8510A]"
                  title="Edit service"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(svc)}
                  className="rounded-md p-1.5 text-[var(--a-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Delete service"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingService ? 'Edit Service' : 'Add Service'}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] transition-colors hover:bg-[var(--a-hover)] disabled:opacity-50"
            >
              Cancel
            </button>
            <AsyncButton
              label={editingService ? 'Save Changes' : 'Create Service'}
              loadingLabel={editingService ? 'Saving…' : 'Creating…'}
              loading={saving}
              onClick={handleSave}
              variant="primary"
            />
          </>
        }
      >
        {saveError && <ErrorBanner message={saveError} className="mb-4" />}

        <div className="grid gap-4">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-[var(--a-ink2)]">
              Name <span className="text-[#E8510A]">*</span>
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. VIP Seating"
              className={inputCls}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-[var(--a-ink2)]">
              Slug <span className="text-[#E8510A]">*</span>
            </span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="vip-seating"
              className={inputCls}
            />
            <span className="mt-1 block text-xs text-[var(--a-muted)]">URL-friendly identifier. Auto-generated from name.</span>
          </label>

          <label className="block">
            <span className="mb-1.5 text-[13px] font-semibold text-[var(--a-ink2)]">Short Description</span>
            <input
              type="text"
              value={form.short_description ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, short_description: e.target.value || null }))}
              placeholder="Brief summary shown on cards"
              className={inputCls}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 text-[13px] font-semibold text-[var(--a-ink2)]">Description</span>
            <textarea
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value || null }))}
              placeholder="Full description shown on the service detail page"
              className={cn(inputCls, 'h-auto py-2 resize-none')}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-[var(--a-ink2)]">
                {form.allow_custom_amount ? 'Minimum Amount (KES)' : 'Price (KES)'} <span className="text-[#E8510A]">*</span>
              </span>
              <input
                type="number"
                min={0}
                step={100}
                value={form.price || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                placeholder="0"
                className={inputCls}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-[var(--a-ink2)]">
                Duration (minutes)
              </span>
              <input
                type="number"
                min={1}
                step={5}
                value={form.duration_minutes}
                onChange={(e) => setForm((prev) => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                className={inputCls}
              />
            </label>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-4 py-3">
            <div>
              <span className="text-[13px] font-semibold text-[var(--a-ink2)]">Allow Custom Amount</span>
              <p className="text-xs text-[var(--a-muted)]">Let customers enter the amount they want to pay. Price becomes the minimum.</p>
            </div>
            <Toggle
              checked={form.allow_custom_amount}
              onChange={(next) => setForm((prev) => ({ ...prev, allow_custom_amount: next }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-4 py-3">
            <div>
              <span className="text-[13px] font-semibold text-[var(--a-ink2)]">Active</span>
              <p className="text-xs text-[var(--a-muted)]">Visible to customers when enabled</p>
            </div>
            <Toggle
              checked={form.is_active}
              onChange={(next) => setForm((prev) => ({ ...prev, is_active: next }))}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Service"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] transition-colors hover:bg-[var(--a-hover)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-5 text-[13px] font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600">
            <Trash2 className="h-5 w-5" />
          </span>
          <div>
            <p className="pt-1.5 text-sm leading-relaxed text-[var(--a-text)]">
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            </p>
            <p className="mt-1 text-xs text-[var(--a-muted)]">
              This action cannot be undone. Customers will no longer be able to book this service.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}

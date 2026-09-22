'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, Ban, PartyPopper, Repeat, CalendarDays, Info, Clock, Pencil } from 'lucide-react';
import { adminFetch, adminPut } from '@/lib/admin-client';
import { useConfirm } from '@/components/admin/confirm';
import { Modal } from '@/components/admin/ui';
import { formatDate } from '@/lib/date-utils';
import { DatePicker } from '@/components/ui/date-picker';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Holiday {
  id: number;
  holiday_date: string;
  name: string;
  is_recurring: number;
}

interface BlockedDate {
  id: number;
  blocked_date: string;
  reason: string | null;
  created_by: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDateString(val: string | Date): string {
  if (val instanceof Date) {
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, '0');
    const d = String(val.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val).slice(0, 10);
}

function getMonthDay(val: string | Date): { month: string; day: number; monthNum: number } {
  const raw = toDateString(val);
  const [y, m, d] = raw.split('-').map(Number);
  if (!y || !m || !d) return { month: 'Unknown', day: 0, monthNum: 0 };
  return {
    month: MONTH_NAMES[m - 1],
    day: d,
    monthNum: m,
  };
}

function formatRecurringDisplay(dateStr: string | Date): string {
  const { month, day } = getMonthDay(dateStr);
  const suffix = getDaySuffix(day);
  return `Every ${month} ${day}${suffix}`;
}

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/* ------------------------------------------------------------------ */
/*  Shared input classes                                               */
/* ------------------------------------------------------------------ */

const inputCls = 'h-10 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-sm text-[var(--a-ink)] placeholder-[var(--a-muted)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20';

/* ------------------------------------------------------------------ */
/*  Holidays Manager                                                   */
/* ------------------------------------------------------------------ */

export function HolidaysManager() {
  const confirm = useConfirm();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formName, setFormName] = useState('');
  const [formRecurring, setFormRecurring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const recurring = holidays.filter((h) => h.is_recurring);
  const oneOff = holidays.filter((h) => !h.is_recurring);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ holidays: Holiday[] }>('/api/admin/bookings/holidays');
      setHolidays(data.holidays ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load holidays.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openAddModal = () => {
    setEditingId(null);
    setFormDate('');
    setFormName('');
    setFormRecurring(false);
    setSaveError(null);
    setModalOpen(true);
  };

  const openEditModal = (h: Holiday) => {
    setEditingId(h.id);
    setFormDate(toDateString(h.holiday_date));
    setFormName(h.name);
    setFormRecurring(h.is_recurring === 1);
    setSaveError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormDate('');
    setFormName('');
    setFormRecurring(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!formDate || !formName.trim()) {
      setSaveError('Date and name are required.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (editingId) {
        await adminPut('/api/admin/bookings/holidays', {
          id: editingId,
          date: formDate,
          name: formName.trim(),
          is_recurring: formRecurring,
        });
      } else {
        await adminFetch('/api/admin/bookings/holidays', {
          method: 'POST',
          body: JSON.stringify({ date: formDate, name: formName.trim(), is_recurring: formRecurring }),
        });
      }
      closeModal();
      await load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : `Failed to ${editingId ? 'update' : 'add'} holiday.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (h: Holiday) => {
    const dateDisplay = h.is_recurring ? formatRecurringDisplay(h.holiday_date) : formatDate(toDateString(h.holiday_date), 'dd MMM yyyy');
    const ok = await confirm({
      title: 'Remove Holiday',
      message: h.is_recurring
        ? `Remove "${h.name}" (${dateDisplay})? This will stop it from blocking bookings every year.`
        : `Remove "${h.name}" on ${formatDate(toDateString(h.holiday_date), 'dd MMM yyyy')}?`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/bookings/holidays?id=${h.id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove holiday.');
    }
  };

  const previewMonthDay = formDate ? getMonthDay(formDate) : null;

  return (
    <section className="rounded-xl border border-[var(--a-border)] bg-[var(--a-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <header className="border-b border-[var(--a-border-soft)] px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8510A]/10 text-[#E8510A]">
              <PartyPopper className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[var(--a-ink)]">Public Holidays</h3>
              <p className="text-xs text-[var(--a-muted)]">Dates when bookings are unavailable</p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8510A] px-3.5 py-2 text-[12px] font-bold text-white shadow-[0_1px_3px_rgba(232,81,10,0.3)] transition-all hover:bg-[#c94508] hover:shadow-[0_2px_8px_rgba(232,81,10,0.4)] active:scale-[0.97]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Holiday
          </button>
        </div>

        {/* Stats */}
        {!loading && holidays.length > 0 && (
          <div className="mt-3 flex items-center gap-4 text-[11px] text-[var(--a-muted)]">
            <span className="flex items-center gap-1">
              <Repeat className="h-3 w-3" />
              {recurring.length} recurring
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {oneOff.length} one-time
            </span>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="px-5 py-3">
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-[var(--a-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading holidays…
          </div>
        ) : error ? (
          <p className="py-4 text-sm text-red-500">{error}</p>
        ) : holidays.length === 0 ? (
          <div className="py-8 text-center">
            <CalendarDays className="mx-auto mb-2 h-8 w-8 text-[var(--a-muted)]/40" />
            <p className="text-sm font-medium text-[var(--a-ink2)]">No holidays configured</p>
            <p className="mt-1 text-xs text-[var(--a-muted)]">Add holidays to block those dates from bookings</p>
          </div>
        ) : (
          <div className="max-h-80 space-y-4 overflow-y-auto">
            {/* Recurring Section */}
            {recurring.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <Repeat className="h-3 w-3 text-[#E8510A]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#E8510A]">Recurring Every Year</span>
                </div>
                <div className="space-y-1">
                  {recurring.map((h) => {
                    const { month, day } = getMonthDay(h.holiday_date);
                    return (
                      <div
                        key={h.id}
                        className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--a-subtle)]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8510A]/8 text-[#E8510A]">
                            <span className="text-[10px] font-bold leading-none">{String(day)}</span>
                          </div>
                          <div>
                            <span className="text-[13px] font-semibold text-[var(--a-ink2)]">{h.name}</span>
                            <p className="text-[11px] text-[var(--a-muted)]">
                              Every {month} {day}{getDaySuffix(day)} — blocks bookings annually
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 transition-all group-hover:opacity-100">
                          <button
                            onClick={() => openEditModal(h)}
                            className="rounded p-1.5 text-[var(--a-muted)] transition-all hover:bg-blue-50 hover:text-blue-600"
                            title="Edit holiday"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => void handleDelete(h)}
                            className="rounded p-1.5 text-[var(--a-muted)] transition-all hover:bg-red-50 hover:text-red-500"
                            title="Remove holiday"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* One-time Section */}
            {oneOff.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3 text-[var(--a-muted)]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--a-muted)]">One-Time / Moveable</span>
                </div>
                <div className="space-y-1">
                  {oneOff.map((h) => (
                    <div
                      key={h.id}
                      className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--a-subtle)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--a-subtle)] text-[var(--a-muted)]">
                          <span className="text-[10px] font-bold leading-none">{String(getMonthDay(h.holiday_date).day)}</span>
                        </div>
                        <div>
                          <span className="text-[13px] font-semibold text-[var(--a-ink2)]">{h.name}</span>
                          <p className="text-[11px] text-[var(--a-muted)]">
                            {formatDate(toDateString(h.holiday_date), 'dd MMM yyyy')} — one-time, add again next year
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 transition-all group-hover:opacity-100">
                        <button
                          onClick={() => openEditModal(h)}
                          className="rounded p-1.5 text-[var(--a-muted)] transition-all hover:bg-blue-50 hover:text-blue-600"
                          title="Edit holiday"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => void handleDelete(h)}
                          className="rounded p-1.5 text-[var(--a-muted)] transition-all hover:bg-red-50 hover:text-red-500"
                          title="Remove holiday"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info footer */}
      {!loading && holidays.length > 0 && (
        <div className="border-t border-[var(--a-border-soft)] px-5 py-3">
          <div className="flex items-start gap-2 text-[11px] text-[var(--a-muted)]">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            <p>
              <strong className="font-semibold text-[var(--a-ink2)]">Recurring</strong> holidays use the month &amp; day only — they block that date every year automatically.
              <strong className="ml-1 font-semibold text-[var(--a-ink2)]"> One-time</strong> holidays are for moveable dates (Easter, Eid) that change each year.
            </p>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Holiday' : 'Add Holiday'}
        footer={
          <>
            <button
              onClick={closeModal}
              disabled={saving}
              className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] transition-colors hover:bg-[var(--a-hover)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#E8510A] px-5 text-[13px] font-bold text-white transition-colors hover:bg-[#c94508] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving
                ? editingId ? 'Saving…' : 'Adding…'
                : editingId ? 'Save Changes' : 'Add Holiday'}
            </button>
          </>
        }
      >
        {saveError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{saveError}</div>
        )}
        <div className="space-y-4">
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Date *</span>
            <DatePicker
              value={formDate}
              onSelect={(iso) => setFormDate(iso)}
              placeholder="Pick a date"
              disablePast={false}
              clearable
            />
            <span className="mt-1 block text-[11px] text-[var(--a-muted)]">
              Pick any year — for recurring holidays, only the month &amp; day are used.
            </span>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Holiday Name *</span>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Jamhuri Day"
              className={inputCls}
            />
          </label>

          {/* Recurring toggle with description */}
          <div className="rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={formRecurring}
                onChange={(e) => setFormRecurring(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--a-border)] accent-[#E8510A]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <Repeat className="h-3.5 w-3.5 text-[#E8510A]" />
                  <span className="text-[13px] font-bold text-[var(--a-ink2)]">Recurring every year</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--a-muted)]">
                  {formRecurring ? (
                    <>
                      This holiday will automatically block <strong className="text-[var(--a-ink2)]">
                        {previewMonthDay ? `${previewMonthDay.month} ${previewMonthDay.day}` : 'this date'}
                      </strong> every year. No need to add it again in future years.
                    </>
                  ) : (
                    <>
                      Enable this for national holidays with fixed dates (e.g. Christmas, Labour Day).
                      Leave off for moveable holidays like Easter or Eid that change each year.
                    </>
                  )}
                </p>
              </div>
            </label>
          </div>
        </div>
      </Modal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Blocked Dates Manager                                              */
/* ------------------------------------------------------------------ */

export function BlockedDatesManager() {
  const confirm = useConfirm();
  const [dates, setDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formReason, setFormReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ blocked_dates: BlockedDate[] }>('/api/admin/bookings/blocked-dates');
      setDates(data.blocked_dates ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load blocked dates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openAddModal = () => {
    setEditingId(null);
    setFormDate('');
    setFormReason('');
    setSaveError(null);
    setModalOpen(true);
  };

  const openEditModal = (d: BlockedDate) => {
    setEditingId(d.id);
    setFormDate(toDateString(d.blocked_date));
    setFormReason(d.reason ?? '');
    setSaveError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormDate('');
    setFormReason('');
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!formDate) {
      setSaveError('Date is required.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (editingId) {
        await adminPut('/api/admin/bookings/blocked-dates', {
          id: editingId,
          date: formDate,
          reason: formReason.trim() || null,
        });
      } else {
        await adminFetch('/api/admin/bookings/blocked-dates', {
          method: 'POST',
          body: JSON.stringify({ date: formDate, reason: formReason.trim() || null }),
        });
      }
      closeModal();
      await load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : `Failed to ${editingId ? 'update' : 'block'} date.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (d: BlockedDate) => {
    const label = d.reason ? `"${d.reason}"` : formatDate(toDateString(d.blocked_date), 'dd MMM yyyy');
    const ok = await confirm({
      title: 'Remove Blocked Date',
      message: `Remove blocked date ${label}? This date will become available for bookings again.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/bookings/blocked-dates?id=${d.id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove blocked date.');
    }
  };

  return (
    <section className="rounded-xl border border-[var(--a-border)] bg-[var(--a-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <header className="border-b border-[var(--a-border-soft)] px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
              <Ban className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[var(--a-ink)]">Blocked Dates</h3>
              <p className="text-xs text-[var(--a-muted)]">Office closures &amp; custom blocked dates</p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8510A] px-3.5 py-2 text-[12px] font-bold text-white shadow-[0_1px_3px_rgba(232,81,10,0.3)] transition-all hover:bg-[#c94508] hover:shadow-[0_2px_8px_rgba(232,81,10,0.4)] active:scale-[0.97]"
          >
            <Plus className="h-3.5 w-3.5" />
            Block Date
          </button>
        </div>

        {!loading && dates.length > 0 && (
          <div className="mt-3 flex items-center gap-4 text-[11px] text-[var(--a-muted)]">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {dates.length} date{dates.length !== 1 ? 's' : ''} blocked
            </span>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="px-5 py-3">
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-[var(--a-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading blocked dates…
          </div>
        ) : error ? (
          <p className="py-4 text-sm text-red-500">{error}</p>
        ) : dates.length === 0 ? (
          <div className="py-8 text-center">
            <Ban className="mx-auto mb-2 h-8 w-8 text-[var(--a-muted)]/40" />
            <p className="text-sm font-medium text-[var(--a-ink2)]">No blocked dates</p>
            <p className="mt-1 text-xs text-[var(--a-muted)]">Block specific dates for office closures or events</p>
          </div>
        ) : (
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {dates.map((d) => (
              <div
                key={d.id}
                className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--a-subtle)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/8 text-red-500">
                    <span className="text-[10px] font-bold leading-none">{String(getMonthDay(d.blocked_date).day)}</span>
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold text-[var(--a-ink2)]">
                      {formatDate(toDateString(d.blocked_date), 'dd MMM yyyy')}
                    </span>
                    {d.reason && (
                      <p className="text-[11px] text-[var(--a-muted)]">{d.reason}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 transition-all group-hover:opacity-100">
                  <button
                    onClick={() => openEditModal(d)}
                    className="rounded p-1.5 text-[var(--a-muted)] transition-all hover:bg-blue-50 hover:text-blue-600"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => void handleDelete(d)}
                    className="rounded p-1.5 text-[var(--a-muted)] transition-all hover:bg-red-50 hover:text-red-500"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info footer */}
      {!loading && dates.length > 0 && (
        <div className="border-t border-[var(--a-border-soft)] px-5 py-3">
          <div className="flex items-start gap-2 text-[11px] text-[var(--a-muted)]">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            <p>Blocked dates are one-time. Remove a block to make the date available for bookings again.</p>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Blocked Date' : 'Block a Date'}
        footer={
          <>
            <button
              onClick={closeModal}
              disabled={saving}
              className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] transition-colors hover:bg-[var(--a-hover)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#E8510A] px-5 text-[13px] font-bold text-white transition-colors hover:bg-[#c94508] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving
                ? editingId ? 'Saving…' : 'Blocking…'
                : editingId ? 'Save Changes' : 'Block Date'}
            </button>
          </>
        }
      >
        {saveError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{saveError}</div>
        )}
        <div className="space-y-4">
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Date *</span>
            <DatePicker
              value={formDate}
              onSelect={(iso) => setFormDate(iso)}
              placeholder="Pick a date"
              disablePast={false}
              clearable
            />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Reason (optional)</span>
            <input
              type="text"
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder="e.g. Office closed for team retreat"
              className={inputCls}
            />
            <span className="mt-1 block text-[11px] text-[var(--a-muted)]">
              Shown to admins for context. Customers see &ldquo;This date is blocked&rdquo;.
            </span>
          </label>
        </div>
      </Modal>
    </section>
  );
}

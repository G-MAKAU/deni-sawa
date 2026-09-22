'use client';

import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Phone,
  Mail,
  Video,
  X,
  Loader2,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import { Modal } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Booking {
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  status: string;
  booked_time: string | null;
  service_name: string;
  meet_link: string | null;
}

interface DayBookings {
  date: string; // YYYY-MM-DD
  count: number;
  bookings: Booking[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function statusTone(status: string): string {
  switch (status) {
    case 'booked':
      return 'green';
    case 'paid':
      return 'blue';
    case 'pending_payment':
      return 'amber';
    case 'cancelled':
      return 'red';
    default:
      return 'grey';
  }
}

function statusPillClasses(status: string): string {
  switch (status) {
    case 'booked':
      return 'bg-[#5A9E28]/10 text-[#3f7a1a] border-[#5A9E28]/25';
    case 'paid':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/25';
    case 'pending_payment':
      return 'bg-amber-500/10 text-amber-700 border-amber-500/25';
    case 'cancelled':
      return 'bg-red-500/10 text-red-600 border-red-500/25';
    default:
      return 'bg-[#6B7280]/10 text-[var(--a-text)] border-[#6B7280]/25';
  }
}

function formatKES(amount: number): string {
  return `KES ${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function startDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isToday(dateStr: string): boolean {
  const now = new Date();
  return toISODate(now.getFullYear(), now.getMonth(), now.getDate()) === dateStr;
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function CalendarSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-5">
      <div className="flex items-center justify-between">
        <div className="h-7 w-44 rounded-md bg-[var(--a-subtle)]" />
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-lg bg-[var(--a-subtle)]" />
          <div className="h-8 w-8 rounded-lg bg-[var(--a-subtle)]" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-6 rounded bg-[var(--a-subtle)]" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-[var(--a-subtle)]/60" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AdminBookingsCalendar() {
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth());
  const [days, setDays] = React.useState<DayBookings[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  /* ---- Data fetching ---- */
  const loadMonth = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const monthParam = `${year}-${String(month + 1).padStart(2, '0')}`;
      const data = await adminFetch<{ ok: boolean; days: DayBookings[] }>(
        `/api/admin/bookings/calendar?month=${monthParam}`
      );
      setDays(data.days ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calendar.');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  React.useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  /* ---- Navigation ---- */
  const goToPrev = () => {
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const goToNext = () => {
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  const goToToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  /* ---- Calendar grid computation ---- */
  const totalDays = daysInMonth(year, month);
  const firstDay = startDayOfWeek(year, month);
  const totalCells = Math.ceil((firstDay + totalDays) / 7) * 7;

  // Build a lookup map for quick access to day booking data.
  const dayMap = React.useMemo(() => {
    const map = new Map<string, DayBookings>();
    for (const d of days) {
      map.set(d.date, d);
    }
    return map;
  }, [days]);

  const gridCells = React.useMemo(() => {
    const cells: { dayNum: number; dateStr: string; outside: boolean }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - firstDay + 1;
      if (dayNum < 1 || dayNum > totalDays) {
        cells.push({ dayNum: 0, dateStr: '', outside: true });
      } else {
        const dateStr = toISODate(year, month, dayNum);
        cells.push({ dayNum, dateStr, outside: false });
      }
    }
    return cells;
  }, [totalDays, firstDay, year, month, totalCells]);

  /* ---- Selected day bookings ---- */
  const selectedDayData = selectedDate ? dayMap.get(selectedDate) ?? null : null;

  return (
    <section className="rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      {loading ? (
        <CalendarSkeleton />
      ) : error ? (
        <div className="rounded-lg border border-red-500/25 bg-red-500/5 px-5 py-14 text-center text-sm text-red-600">
          {error}
        </div>
      ) : (
        <div className="p-5">
          {/* ---- Header ---- */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-[#E8510A]" />
              <h2 className="font-heading text-lg font-bold text-[var(--a-ink2)]">
                {MONTHS[month]} {year}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToToday}
                className="inline-flex items-center rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 py-1.5 text-xs font-semibold text-[var(--a-text)] transition-colors hover:border-[#E8510A]/40 hover:text-[#E8510A]"
              >
                Today
              </button>
              <button
                type="button"
                onClick={goToPrev}
                aria-label="Previous month"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] text-[var(--a-muted)] transition-colors hover:border-[#E8510A]/40 hover:text-[#E8510A]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goToNext}
                aria-label="Next month"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] text-[var(--a-muted)] transition-colors hover:border-[#E8510A]/40 hover:text-[#E8510A]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ---- Day-of-week headers ---- */}
          <div className="mb-1 grid grid-cols-7">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-2 text-center text-[11px] font-bold uppercase tracking-wider text-[var(--a-muted)]"
              >
                {label}
              </div>
            ))}
          </div>

          {/* ---- Calendar grid ---- */}
          <div className="grid grid-cols-7 gap-1">
            {gridCells.map((cell, idx) => {
              if (cell.outside) {
                return <div key={`empty-${idx}`} className="h-20" />;
              }

              const dayData = dayMap.get(cell.dateStr);
              const hasBookings = dayData && dayData.count > 0;
              const isSelected = selectedDate === cell.dateStr;
              const isTodayCell = isToday(cell.dateStr);

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => {
                    if (hasBookings) {
                      setSelectedDate(isSelected ? null : cell.dateStr);
                    } else {
                      setSelectedDate(null);
                    }
                  }}
                  disabled={!hasBookings}
                  className={cn(
                    'group relative flex h-20 flex-col items-center gap-1 rounded-lg border p-1.5 text-left transition-all duration-200',
                    isSelected
                      ? 'border-[#E8510A] bg-[#E8510A] shadow-md ring-2 ring-[#E8510A]/20'
                      : isTodayCell
                        ? 'border-[#E8510A]/50 bg-[#E8510A]/5'
                        : hasBookings
                          ? 'border-[var(--a-border-soft)] bg-[var(--a-card)] hover:border-[#E8510A]/40 hover:bg-[#E8510A]/5 cursor-pointer'
                          : 'border-transparent bg-transparent opacity-40 cursor-default'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                      isSelected
                        ? 'text-white'
                        : isTodayCell
                          ? 'bg-[#E8510A] text-white'
                          : 'text-[var(--a-ink2)]'
                    )}
                  >
                    {cell.dayNum}
                  </span>
                  {hasBookings && (
                    <span
                      className={cn(
                        'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none transition-colors',
                        isSelected
                          ? 'bg-white/25 text-white'
                          : 'bg-[#E8510A]/10 text-[#E8510A]'
                      )}
                    >
                      {dayData.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- Day detail modal ---- */}
      <Modal
        open={!!selectedDayData}
        onClose={() => setSelectedDate(null)}
        title={
          selectedDayData
            ? `Bookings for ${formatDateLong(selectedDayData.date)}`
            : ''
        }
        wide
      >
        {selectedDayData && (
          <div>
            <p className="mb-4 text-sm text-[var(--a-muted)]">
              {selectedDayData.count} booking{selectedDayData.count !== 1 ? 's' : ''} found
            </p>

            {selectedDayData.bookings.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--a-border)] bg-[var(--a-card)] px-6 py-14 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8510A]/10 text-[#E8510A]">
                  <Calendar className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-[var(--a-ink2)]">No bookings</p>
                <p className="max-w-sm text-xs text-[var(--a-muted)]">
                  There are no bookings for this day.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {selectedDayData.bookings.map((booking) => (
                  <div
                    key={booking.reference}
                    className="rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)]/50 p-4 transition-colors hover:border-[#E8510A]/30"
                  >
                    {/* Top row: service badge + status + time */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-[var(--a-border)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--a-ink2)]">
                        {booking.service_name}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                          statusPillClasses(booking.status)
                        )}
                      >
                        {booking.status.replace('_', ' ')}
                      </span>
                      {booking.booked_time && (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--a-muted)]">
                          <Clock className="h-3 w-3" />
                          {booking.booked_time.slice(0, 5)}
                        </span>
                      )}
                    </div>

                    {/* Customer info */}
                    <div className="mb-2 flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-[var(--a-muted)]" />
                      <span className="text-sm font-semibold text-[var(--a-ink2)]">
                        {booking.customer_name}
                      </span>
                    </div>

                    <div className="ml-5 space-y-1">
                      {booking.customer_phone && (
                        <div className="flex items-center gap-2 text-xs text-[var(--a-muted)]">
                          <Phone className="h-3 w-3" />
                          {booking.customer_phone}
                        </div>
                      )}
                      {booking.customer_email && (
                        <div className="flex items-center gap-2 text-xs text-[var(--a-muted)]">
                          <Mail className="h-3 w-3" />
                          {booking.customer_email}
                        </div>
                      )}
                    </div>

                    {/* Bottom row: amount + meet link */}
                    <div className="mt-3 flex items-center justify-between border-t border-[var(--a-border-soft)] pt-3">
                      <span className="text-sm font-bold text-[var(--a-ink2)]">
                        {formatKES(booking.amount)}
                      </span>
                      {booking.meet_link && (
                        <a
                          href={booking.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#5A9E28]/30 bg-[#5A9E28]/10 px-3 py-1.5 text-xs font-semibold text-[#3f7a1a] transition-colors hover:bg-[#5A9E28]/20"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Join Meeting
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  );
}

'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { RefreshCw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch } from '@/lib/admin-client';
import { DatePicker } from '@/components/ui/date-picker';
import { EmptyState, ErrorBanner, Loading, PageHeader, StatusPill, Td, Th } from '@/components/admin/ui';
import type { StatusTone } from '@/components/admin/ui';
import { useConfirm } from '@/components/admin/confirm';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  status: string;
  attempts: number;
  error_message: string | null;
  last_attempted_at: string | null;
  sent_at: string | null;
  created_at: string;
  [key: string]: unknown;
}

/** Serializable column config — rendering is handled inside the client component. */
interface ColumnDef {
  key: string;
  label: string;
}

const DEFAULT_STATUS_TONES: Record<string, StatusTone> = {
  pending: 'amber',
  sent: 'green',
  delivered: 'green',
  read: 'green',
  failed: 'red',
  bounced: 'red',
  skipped: 'grey',
};

const PAGE_SIZE = 25;

/** Renders a cell based on the column key with sensible default formatting. */
function renderCell(entry: LogEntry, key: string): React.ReactNode {
  const value = entry[key];
  if (value === null || value === undefined || value === '') return '—';

  if (key === 'to_email' || key === 'to_number' || key === 'to_name') {
    return <span className="font-medium text-[var(--a-ink2)]">{String(value)}</span>;
  }
  if (key === 'subject' || key === 'body_sent') {
    return <span className="block max-w-[280px] truncate text-[var(--a-text)]">{String(value)}</span>;
  }
  if (key === 'template_key' || key === 'provider') {
    return <span className="font-mono text-[11px] text-[var(--a-muted)]">{String(value)}</span>;
  }
  return <span className="text-[var(--a-text)]">{String(value)}</span>;
}

/** Numbered page window with ellipses for large page counts. */
function pageWindow(current: number, totalPages: number, max = 7): (number | '…')[] {
  if (totalPages <= max) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const start = Math.max(2, current - 2);
  const end = Math.min(totalPages - 1, current + 2);
  const items: (number | '…')[] = [1];
  if (start > 2) items.push('…');
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push('…');
  items.push(totalPages);
  return items;
}

export function LogViewer({
  title,
  subtitle,
  endpoint,
  entryApiPath,
  statuses,
  columns,
  retryableStatuses = [],
}: {
  title: string;
  subtitle: string;
  endpoint: string;
  /** Base path for per-entry actions, e.g. `/api/admin/email-log`. */
  entryApiPath: string;
  statuses: string[];
  columns: ColumnDef[];
  /** Statuses that show a Retry action. */
  retryableStatuses?: string[];
}) {
  const confirm = useConfirm();

  const [entries, setEntries] = React.useState<LogEntry[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [pages, setPages] = React.useState(1);
  const [status, setStatus] = React.useState('all');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (targetPage: number, statusFilter: string, dateFrom: string, dateTo: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (dateFrom) params.set('from', new Date(dateFrom).toISOString());
        if (dateTo) params.set('to', new Date(dateTo + 'T23:59:59').toISOString());
        const data = await adminFetch<{ entries: LogEntry[]; pagination: { total: number; pages?: number } }>(
          `${endpoint}?${params.toString()}`
        );
        setEntries(data.entries ?? []);
        setTotal(data.pagination.total ?? 0);
        setPages(Math.max(1, data.pagination.pages ?? Math.ceil((data.pagination.total ?? 0) / PAGE_SIZE)));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load log entries.');
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  React.useEffect(() => {
    void load(page, status, from, to);
  }, [load, page, status, from, to]);

  const applyFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const retry = async (entry: LogEntry) => {
    setBusyId(entry.id);
    try {
      await adminFetch(`${entryApiPath}/${encodeURIComponent(entry.id)}`, { method: 'POST' });
      toast.success('Message resent');
      void load(page, status, from, to);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to resend message');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (entry: LogEntry) => {
    try {
      const ok = await confirm({
        title: 'Delete log entry',
        message: 'Delete this log entry? The message itself is not affected, but the audit record is removed permanently.',
        confirmLabel: 'Delete',
        danger: true,
        action: async () => {
          await adminFetch(`${entryApiPath}/${encodeURIComponent(entry.id)}`, { method: 'DELETE' });
        },
      });
      if (!ok) return;
      toast.success('Log entry deleted');
      void load(page, status, from, to);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete log entry');
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        crumbs={[{ label: title }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--a-placeholder)]" />
              <select
                value={status}
                onChange={(e) => applyFilter(() => setStatus(e.target.value))}
                className="h-9 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] pl-3 pr-3 text-sm focus:border-[#E8510A] focus:outline-none"
              >
                <option value="all">All statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <DatePicker
              value={from}
              onSelect={(v) => applyFilter(() => setFrom(v))}
              placeholder="From date"
              disablePast={false}
              clearable
              className="h-9 w-36"
            />
            <span className="text-xs text-[var(--a-muted)]">→</span>
            <DatePicker
              value={to}
              onSelect={(v) => applyFilter(() => setTo(v))}
              placeholder="To date"
              disablePast={false}
              clearable
              className="h-9 w-36"
            />
          </div>
        }
      />

      {error && <ErrorBanner message={error} className="mb-6" />}

      <div className="overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {loading ? (
          <Loading label="Loading log…" />
        ) : entries.length === 0 ? (
          <EmptyState title="No log entries" description="Outbound messages appear here as they are sent." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--a-border-soft)] bg-[var(--a-subtle)]">
                <tr>
                  {columns.map((column) => (
                    <Th key={column.key}>{column.label}</Th>
                  ))}
                  <Th align="center">Status</Th>
                  <Th align="center">Attempts</Th>
                  <Th>Sent at</Th>
                  <Th>Details</Th>
                  <Th align="center">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-border-soft)]">
                {entries.map((entry) => {
                  const retryable = retryableStatuses.includes(entry.status);
                  const busy = busyId === entry.id;
                  return (
                    <tr key={entry.id} className="transition-colors hover:bg-[var(--a-subtle)]">
                      {columns.map((column) => (
                        <Td key={column.key}>{renderCell(entry, column.key)}</Td>
                      ))}
                      <Td align="center">
                        <StatusPill tone={DEFAULT_STATUS_TONES[entry.status] ?? 'grey'}>{entry.status}</StatusPill>
                      </Td>
                      <Td align="center">{entry.attempts}</Td>
                      <Td className="text-[var(--a-muted)]">{entry.sent_at ? format(new Date(entry.sent_at), 'dd MMM, HH:mm') : '—'}</Td>
                      <Td className="max-w-[240px]">
                        {entry.error_message ? (
                          <span className="block truncate text-xs text-red-500" title={entry.error_message}>
                            {entry.error_message}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--a-placeholder)]">
                            {format(new Date(entry.created_at as string), 'd MMM yyyy, HH:mm')}
                          </span>
                        )}
                      </Td>
                      <Td align="center">
                        <div className="flex items-center justify-center gap-1">
                          {retryable && (
                            <button
                              type="button"
                              onClick={() => void retry(entry)}
                              disabled={busy}
                              title="Retry sending"
                              aria-label="Retry sending"
                              className="rounded-md p-1.5 text-[var(--a-muted)] transition-colors hover:bg-[#E8510A]/10 hover:text-[#E8510A] disabled:opacity-40"
                            >
                              <RefreshCw className={cn('h-4 w-4', busy && 'animate-spin')} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void remove(entry)}
                            disabled={busy}
                            title="Delete entry"
                            aria-label="Delete entry"
                            className="rounded-md p-1.5 text-[var(--a-muted)] transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--a-border-soft)] px-5 py-3">
          <p className="text-xs text-[var(--a-muted)]">
            {total.toLocaleString()} entr{total === 1 ? 'y' : 'ies'} · page {page} of {pages}
          </p>
          {pages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-[var(--a-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--a-text)] hover:border-[#E8510A]/40 disabled:opacity-40"
              >
                Prev
              </button>
              {pageWindow(page, pages).map((item, i) =>
                item === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-xs text-[var(--a-muted)]">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    aria-current={item === page ? 'page' : undefined}
                    className={cn(
                      'min-w-7 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors',
                      item === page
                        ? 'bg-[#E8510A] text-white'
                        : 'border border-[var(--a-border)] text-[var(--a-text)] hover:border-[#E8510A]/40'
                    )}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="rounded-md border border-[var(--a-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--a-text)] hover:border-[#E8510A]/40 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
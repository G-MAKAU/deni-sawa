'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/date-utils';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Mail,
  MailCheck,
  MailX,
  Search,
  X,
  Eye,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import {
  ErrorBanner,
  Loading,
  PageHeader,
  StatusPill,
  Td,
  Th,
  Modal,
} from '@/components/admin/ui';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useConfirm } from '@/components/admin/confirm';

interface EmailLogEntry {
  id: number;
  booking_reference: string;
  email_type: string;
  subject: string | null;
  recipient_email: string;
  sent_at: string;
  status: string;
  error_message: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  service_name: string | null;
}

interface EmailLogResponse {
  entries: EmailLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function formatEmailType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function emailTypeBadgeClass(type: string): string {
  if (type === 'payment_confirmation') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  }
  if (type === 'booking_confirmation') {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  }
  if (type === 'booking_date_prompt') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
  }
  if (type === 'booking_cancellation') {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
}

function statusPillVariant(status: string): 'success' | 'error' | 'neutral' {
  if (status === 'sent') return 'success';
  if (status === 'failed') return 'error';
  return 'neutral';
}

export default function BookingEmailLogClient() {
  const confirm = useConfirm();
  const [data, setData] = useState<EmailLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [detailEntry, setDetailEntry] = useState<EmailLogEntry | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    logId: number;
    subject: string;
    recipient: string;
    html: string;
    previewText: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendingFromPreview, setSendingFromPreview] = useState(false);

  const hasFilters =
    search !== '' ||
    statusFilter !== '' ||
    typeFilter !== '' ||
    dateFrom !== '' ||
    dateTo !== '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      const result = await adminFetch<EmailLogResponse>(
        `/api/admin/bookings/email-log?${params.toString()}`
      );
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to load email log');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, dateFrom, dateTo]);

  const handleResend = async (entry: EmailLogEntry) => {
    setPreviewLoading(true);
    setPreviewModal(null);
    try {
      const data = await adminFetch<{ ok: boolean; subject: string; recipient: string; html: string; previewText: string; error?: string }>(
        `/api/admin/bookings/email-log/${entry.id}/preview`
      );
      if (!data.ok) {
        toast.error(data.error ?? 'Failed to load email preview');
        return;
      }
      setPreviewModal({ logId: entry.id, subject: data.subject, recipient: data.recipient, html: data.html, previewText: data.previewText });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load email preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmResend = async () => {
    if (!previewModal) return;
    setSendingFromPreview(true);
    try {
      await adminFetch(`/api/admin/bookings/email-log/${previewModal.logId}/resend`, {
        method: 'POST',
        body: JSON.stringify({ subject: previewModal.subject, html: previewModal.html }),
      });
      toast.success('Email resent successfully');
      setPreviewModal(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend email');
    } finally {
      setSendingFromPreview(false);
    }
  };

  const columns = useMemo<ColumnDef<EmailLogEntry, any>[]>(
    () => [
      {
        accessorKey: 'sent_at',
        header: 'Sent',
        cell: ({ row }) => (
          <span className="text-sm" style={{ color: 'var(--a-ink2)' }}>
            {formatDate(row.original.sent_at)}
          </span>
        ),
      },
      {
        accessorKey: 'booking_reference',
        header: 'Reference',
        cell: ({ row }) => (
          <Link
            href={`/admin/bookings/${row.original.booking_reference}`}
            className="text-sm font-medium hover:underline"
            style={{ color: '#E8510A' }}
          >
            {row.original.booking_reference}
          </Link>
        ),
      },
      {
        accessorKey: 'email_type',
        header: 'Type',
        cell: ({ row }) => (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              emailTypeBadgeClass(row.original.email_type)
            )}
          >
            {formatEmailType(row.original.email_type)}
          </span>
        ),
      },
      {
        accessorKey: 'subject',
        header: 'Subject',
        cell: ({ row }) => (
          <span className="text-sm truncate max-w-[250px] block" style={{ color: 'var(--a-ink2)' }}>
            {row.original.subject || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'recipient_email',
        header: 'Recipient',
        cell: ({ row }) => (
          <span className="text-sm" style={{ color: 'var(--a-ink)' }}>
            {row.original.recipient_email}
          </span>
        ),
      },
      {
        accessorKey: 'customer_name',
        header: 'Customer',
        cell: ({ row }) => (
          <span className="text-sm" style={{ color: 'var(--a-ink)' }}>
            {row.original.customer_name || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'service_name',
        header: 'Service',
        cell: ({ row }) => (
          <span className="text-sm" style={{ color: 'var(--a-ink2)' }}>
            {row.original.service_name || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusPill
            tone={
              statusPillVariant(row.original.status) as React.ComponentProps<
                typeof StatusPill
              >['tone']
            }
          >
            {row.original.status === 'sent' ? 'Sent' : 'Failed'}
          </StatusPill>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const entry = row.original;
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDetailEntry(entry)}
                className="rounded p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                title="View details"
              >
                <Eye className="h-4 w-4" style={{ color: 'var(--a-ink2)' }} />
              </button>
              <button
                onClick={() => handleResend(entry)}
                disabled={resendingId === entry.id}
                className="rounded p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
                title="Resend email"
              >
                {resendingId === entry.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#E8510A' }} />
                ) : (
                  <RefreshCw className="h-4 w-4" style={{ color: '#E8510A' }} />
                )}
              </button>
            </div>
          );
        },
      },
    ],
    [resendingId]
  );

  const table = useReactTable({
    data: data?.entries || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages || 1,
  });

  const totalEmails = data?.total || 0;
  const sentCount = data?.entries?.filter((e) => e.status === 'sent').length || 0;
  const failedCount = data?.entries?.filter((e) => e.status === 'failed').length || 0;
  const paymentCount =
    data?.entries?.filter((e) => e.email_type === 'payment_confirmation').length || 0;
  const bookingCount =
    data?.entries?.filter((e) => e.email_type === 'booking_confirmation').length || 0;

  function renderPageNumbers() {
    if (!data) return null;
    const totalPages = data.totalPages;
    const currentPage = page;
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }

    return pages.map((p, idx) =>
      p === 'ellipsis' ? (
        <span key={`e-${idx}`} className="px-1" style={{ color: 'var(--a-ink2)' }}>
          …
        </span>
      ) : (
        <button
          key={p}
          onClick={() => setPage(p)}
          className={cn(
            'min-w-[2rem] rounded px-2 py-1 text-sm font-medium transition-colors',
            p === currentPage
              ? 'text-white'
              : 'hover:bg-black/5 dark:hover:bg-white/10'
          )}
          style={
            p === currentPage
              ? { backgroundColor: '#E8510A' }
              : { color: 'var(--a-ink)' }
          }
        >
          {p}
        </button>
      )
    );
  }

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorBanner message={error} />;

  return (
    <div>
      <PageHeader
        title="Booking Email Log"
        subtitle="View and manage emails sent for bookings"
      />

      {error && <ErrorBanner message={error} />}

      {/* Summary Cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div
          className="rounded-lg border p-4"
          style={{ borderColor: 'var(--a-border)', backgroundColor: 'var(--a-card)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'var(--a-subtle)' }}
            >
              <Mail className="h-5 w-5" style={{ color: 'var(--a-ink2)' }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--a-ink2)' }}>
                Total Emails
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--a-ink)' }}>
                {totalEmails}
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-lg border p-4"
          style={{ borderColor: 'var(--a-border)', backgroundColor: 'var(--a-card)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'rgba(90, 158, 40, 0.1)' }}
            >
              <MailCheck className="h-5 w-5" style={{ color: '#5A9E28' }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--a-ink2)' }}>
                Sent
              </p>
              <p className="text-2xl font-bold" style={{ color: '#5A9E28' }}>
                {sentCount}
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-lg border p-4"
          style={{ borderColor: 'var(--a-border)', backgroundColor: 'var(--a-card)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)' }}
            >
              <MailX className="h-5 w-5" style={{ color: '#dc3545' }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--a-ink2)' }}>
                Failed
              </p>
              <p className="text-2xl font-bold" style={{ color: '#dc3545' }}>
                {failedCount}
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-lg border p-4"
          style={{ borderColor: 'var(--a-border)', backgroundColor: 'var(--a-card)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'var(--a-subtle)' }}
            >
              <Filter className="h-5 w-5" style={{ color: 'var(--a-ink2)' }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--a-ink2)' }}>
                By Type
              </p>
              <div className="flex gap-3 text-sm font-medium" style={{ color: 'var(--a-ink)' }}>
                <span>Payment: {paymentCount}</span>
                <span>Booking: {bookingCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <div
        className="mb-6 rounded-lg border p-4"
        style={{ borderColor: 'var(--a-border)', backgroundColor: 'var(--a-card)' }}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_1fr_1fr]">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--a-ink2)' }}
            />
            <input
              type="text"
              placeholder="Search reference or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#E8510A]/30"
              style={{
                borderColor: 'var(--a-border-soft)',
                backgroundColor: 'var(--a-card)',
                color: 'var(--a-ink)',
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-auto min-w-[130px] rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#E8510A]/30"
            style={{
              borderColor: 'var(--a-border-soft)',
              backgroundColor: 'var(--a-card)',
              color: 'var(--a-ink)',
            }}
          >
            <option value="">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-auto min-w-[150px] rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#E8510A]/30"
            style={{
              borderColor: 'var(--a-border-soft)',
              backgroundColor: 'var(--a-card)',
              color: 'var(--a-ink)',
            }}
          >
            <option value="">All Types</option>
            <option value="payment_confirmation">Payment Conf.</option>
            <option value="booking_confirmation">Booking Conf.</option>
            <option value="booking_date_prompt">Date Prompt</option>
            <option value="booking_cancellation">Cancellation</option>
          </select>

          {/* Date Range */}
          <DatePicker
            value={dateFrom}
            onSelect={(v) => setDateFrom(v)}
            placeholder="From date"
            disablePast={false}
            clearable
          />
          <DatePicker
            value={dateTo}
            onSelect={(v) => setDateTo(v)}
            placeholder="To date"
            disablePast={false}
            clearable
          />
        </div>

        {hasFilters && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setTypeFilter('');
                setDateFrom('');
                setDateTo('');
              }}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
              style={{ color: '#E8510A' }}
            >
              <X className="h-3.5 w-3.5" />
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: 'var(--a-border)', backgroundColor: 'var(--a-card)' }}
      >
        {loading && data && (
          <div className="flex items-center gap-2 border-b px-4 py-2" style={{ borderColor: 'var(--a-border)' }}>
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#E8510A' }} />
            <span className="text-xs" style={{ color: 'var(--a-ink2)' }}>Refreshing…</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} style={{ borderBottom: '1px solid var(--a-border)' }}>
                  {hg.headers.map((header) => (
                    <Th key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </Th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center"
                    style={{ color: 'var(--a-ink2)' }}
                  >
                    <Mail className="mx-auto mb-3 h-10 w-10 opacity-40" />
                    <p className="text-sm font-medium">No email log entries found</p>
                    <p className="mt-1 text-xs">Try adjusting your filters or check back later.</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    style={{ borderBottom: '1px solid var(--a-border-soft)' }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <Td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div
            className="flex items-center justify-between border-t px-4 py-3"
            style={{ borderColor: 'var(--a-border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--a-ink2)' }}>
              Showing page {data.page} of {data.totalPages} ({data.total} total)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" style={{ color: 'var(--a-ink)' }} />
              </button>
              {renderPageNumbers()}
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="rounded p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" style={{ color: 'var(--a-ink)' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!detailEntry}
        onClose={() => setDetailEntry(null)}
        title="Email Log Details"
      >
        {detailEntry && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--a-ink2)' }}>
                  Reference
                </p>
                <Link
                  href={`/admin/bookings/${detailEntry.booking_reference}`}
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#E8510A' }}
                >
                  {detailEntry.booking_reference}
                </Link>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--a-ink2)' }}>
                  Type
                </p>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    emailTypeBadgeClass(detailEntry.email_type)
                  )}
                >
                  {formatEmailType(detailEntry.email_type)}
                </span>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--a-ink2)' }}>
                  Subject
                </p>
                <p className="text-sm" style={{ color: 'var(--a-ink)' }}>
                  {detailEntry.subject || '—'}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--a-ink2)' }}>
                  Recipient
                </p>
                <p className="text-sm" style={{ color: 'var(--a-ink)' }}>
                  {detailEntry.recipient_email}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--a-ink2)' }}>
                  Status
                </p>
                <StatusPill
                  tone={
                    statusPillVariant(detailEntry.status) as React.ComponentProps<
                      typeof StatusPill
                    >['tone']
                  }
                >
                  {detailEntry.status === 'sent' ? 'Sent' : 'Failed'}
                </StatusPill>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--a-ink2)' }}>
                  Customer
                </p>
                <p className="text-sm" style={{ color: 'var(--a-ink)' }}>
                  {detailEntry.customer_name || '—'}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--a-ink2)' }}>
                  Phone
                </p>
                <p className="text-sm" style={{ color: 'var(--a-ink)' }}>
                  {detailEntry.customer_phone || '—'}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--a-ink2)' }}>
                  Service
                </p>
                <p className="text-sm" style={{ color: 'var(--a-ink)' }}>
                  {detailEntry.service_name || '—'}
                </p>
              </div>

              {detailEntry.error_message && (
                <div className="sm:col-span-2">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--a-ink2)' }}>
                    Error Message
                  </p>
                  <div
                    className="rounded-lg border p-3 text-sm"
                    style={{
                      borderColor: 'rgba(220, 53, 69, 0.3)',
                      backgroundColor: 'rgba(220, 53, 69, 0.05)',
                      color: '#dc3545',
                    }}
                  >
                    {detailEntry.error_message}
                  </div>
                </div>
              )}

              <div className="sm:col-span-2">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--a-ink2)' }}>
                  Sent At
                </p>
                <p className="text-sm" style={{ color: 'var(--a-ink)' }}>
                  {formatDate(detailEntry.sent_at)}
                </p>
              </div>
            </div>

            {detailEntry.status === 'failed' && (
              <div className="flex justify-end border-t pt-4" style={{ borderColor: 'var(--a-border)' }}>
                <button
                  onClick={() => {
                    handleResend(detailEntry);
                    setDetailEntry(null);
                  }}
                  disabled={resendingId === detailEntry.id}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#E8510A' }}
                >
                  {resendingId === detailEntry.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Resend Email
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Email Preview Modal */}
      <Modal
        open={!!previewModal}
        onClose={() => { if (!sendingFromPreview) setPreviewModal(null); }}
        title="Email Preview"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPreviewModal(null)}
              disabled={sendingFromPreview}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3.5 py-2 text-[13px] font-semibold text-[var(--a-text)] transition-colors hover:border-[#E8510A]/40 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmResend}
              disabled={sendingFromPreview}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8510A] px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#C44508] disabled:opacity-50"
            >
              {sendingFromPreview ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending…
                </>
              ) : (
                'Confirm & Send'
              )}
            </button>
          </>
        }
      >
        {previewLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--a-muted)' }} />
            <span className="ml-2 text-sm" style={{ color: 'var(--a-muted)' }}>Loading preview…</span>
          </div>
        ) : previewModal ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: 'var(--a-border)', backgroundColor: 'var(--a-subtle)' }}>
              <div className="flex gap-2 text-[13px]">
                <span className="font-semibold w-20 shrink-0" style={{ color: 'var(--a-muted)' }}>To:</span>
                <span style={{ color: 'var(--a-ink2)' }}>{previewModal.recipient}</span>
              </div>
              <div className="flex gap-2 text-[13px]">
                <span className="font-semibold w-20 shrink-0" style={{ color: 'var(--a-muted)' }}>Subject:</span>
                <span className="font-medium" style={{ color: 'var(--a-ink2)' }}>{previewModal.subject}</span>
              </div>
            </div>
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--a-border)' }}>
              <div className="px-3 py-1.5 border-b" style={{ backgroundColor: 'var(--a-subtle)', borderColor: 'var(--a-border)' }}>
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--a-muted)' }}>Email Preview</span>
              </div>
              <div
                className="bg-white p-4 max-h-[400px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: previewModal.html }}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

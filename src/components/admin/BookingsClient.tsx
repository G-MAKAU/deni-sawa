'use client';

import * as React from 'react';
import Link from 'next/link';
import { formatDate as format } from '@/lib/date-utils';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { 
  Calendar, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Filter, 
  Search, 
  X,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Users,
  CalendarCheck,
  AlertCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import { ErrorBanner, Loading, PageHeader, StatusPill, Td, Th, Modal } from '@/components/admin/ui';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BookingRow {
  id: number;
  reference: string;
  service_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  status: string;
  booked_date: string | null;
  booked_time: string | null;
  payment_status: string | null;
  mpesa_receipt: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

interface BookingStats {
  total_bookings: number;
  pending_payment: number;
  paid: number;
  booked: number;
  cancelled: number;
  total_revenue: number;
}

interface Service {
  id: number;
  name: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'booked', label: 'Booked' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_TONES: Record<string, 'amber' | 'blue' | 'green' | 'red' | 'grey'> = {
  pending_payment: 'amber',
  paid: 'blue',
  booked: 'green',
  cancelled: 'red',
};

function StatCard({ 
  label, 
  value, 
  icon, 
  className 
}: { 
  label: string; 
  value: string | number; 
  icon?: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 py-3', className)}>
      <div className="flex items-center gap-2 text-xs font-medium text-[var(--a-muted)]">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-xl font-bold text-[var(--a-ink)]">{value}</p>
    </div>
  );
}

export function BookingsClient() {
  const [bookings, setBookings] = React.useState<BookingRow[]>([]);
  const [stats, setStats] = React.useState<BookingStats | null>(null);
  const [services, setServices] = React.useState<Service[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [serviceFilter, setServiceFilter] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<BookingRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('');
  const [cancelSendEmail, setCancelSendEmail] = React.useState(true);

  const PAGE_SIZE = 20;

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        page: String(page), 
        pageSize: String(PAGE_SIZE) 
      });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (serviceFilter) params.set('service_id', serviceFilter);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);

      const data = await adminFetch<{
        bookings: BookingRow[];
        stats: BookingStats;
        pagination: { total: number };
      }>(`/api/admin/bookings?${params.toString()}`);

      setBookings(data.bookings);
      setStats(data.stats);
      setTotal(data.pagination.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, serviceFilter, dateFrom, dateTo]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    adminFetch<{ services: Service[] }>('/api/admin/bookings/services')
      .then((data) => setServices(data.services ?? []))
      .catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation.');
      return;
    }
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/bookings/${deleteTarget.reference}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'cancelled',
          cancel_reason: cancelReason.trim(),
          send_email: cancelSendEmail,
        }),
      });
      setDeleteTarget(null);
      setCancelReason('');
      setCancelSendEmail(true);
      toast.success('Booking cancelled successfully.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel booking.');
    } finally {
      setDeleting(false);
    }
  };

  const columns = React.useMemo<ColumnDef<BookingRow>[]>(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ getValue }) => format(new Date(getValue() as string), 'dd MMM yyyy, HH:mm'),
      },
      {
        accessorKey: 'reference',
        header: 'Reference',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-semibold text-[#E8510A]">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'customer_name',
        header: 'Customer',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-[var(--a-ink)]">{row.original.customer_name}</div>
            <div className="text-xs text-[var(--a-muted)]">{row.original.customer_email}</div>
            <div className="text-xs text-[var(--a-muted)]">{row.original.customer_phone}</div>
          </div>
        ),
      },
      {
        accessorKey: 'service_name',
        header: 'Service',
        cell: ({ getValue }) => getValue() as string,
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ getValue }) => (
          <span className="font-semibold">
            KES {Number(getValue() ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ),
        meta: { align: 'right' },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const s = getValue() as string;
          const tone = STATUS_TONES[s] || 'grey';
          return <StatusPill tone={tone}>{s.replace('_', ' ')}</StatusPill>;
        },
      },
      {
        id: 'change_window',
        header: 'Change Window',
        cell: ({ row }) => {
          const { status, created_at } = row.original;
          if (status !== 'paid') return <span className="text-[var(--a-muted)]">—</span>;
          const created = new Date(created_at);
          const deadline = new Date(created);
          deadline.setDate(deadline.getDate() + 3);
          const now = new Date();
          const diffMs = deadline.getTime() - now.getTime();
          const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          const hoursLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
          const canChange = now < deadline;
          return (
            <span className={cn('text-xs font-medium', canChange ? 'text-[#E8510A]' : 'text-[var(--a-muted)]')}>
              {canChange
                ? daysLeft > 0
                  ? `${daysLeft}d left`
                  : `${hoursLeft}h left`
                : 'Closed'}
            </span>
          );
        },
      },
      {
        accessorKey: 'booked_date',
        header: 'Scheduled',
        cell: ({ row }) => {
          const { booked_date, booked_time } = row.original;
          if (!booked_date) return <span className="text-[var(--a-muted)]">—</span>;
          return (
            <div>
              <div className="text-sm">{format(new Date(booked_date + 'T12:00:00Z'), 'dd MMM yyyy')}</div>
              {booked_time && (
                <div className="text-xs text-[var(--a-muted)]">{booked_time.slice(0, 5)}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'mpesa_receipt',
        header: 'Receipt',
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          return v ? (
            <span className="font-mono text-xs font-semibold text-[#5A9E28]">{v}</span>
          ) : (
            <span className="text-[var(--a-muted)]">—</span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const booking = row.original;
          return (
            <div className="flex items-center gap-1">
              <Link
                href={`/admin/bookings/${booking.reference}`}
                className="rounded p-1 text-[var(--a-muted)] hover:bg-[var(--a-subtle)] hover:text-[#E8510A] transition-colors"
                title="View details"
              >
                <Eye className="h-4 w-4" />
              </Link>
              <Link
                href={`/admin/bookings/${booking.reference}?edit=true`}
                className="rounded p-1 text-[var(--a-muted)] hover:bg-[var(--a-subtle)] hover:text-[#5A9E28] transition-colors"
                title="Edit booking"
              >
                <Edit className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setDeleteTarget(booking)}
                disabled={deleting}
                className="rounded p-1 text-[var(--a-muted)] hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                title="Cancel booking"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [deleting]
  );

  const table = useReactTable({
    data: bookings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = search || statusFilter || serviceFilter || dateFrom || dateTo;

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Manage all customer bookings, payments, and scheduling."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Bookings' }]}
        actions={
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors',
              showFilters || hasFilters
                ? 'border-[#E8510A] bg-[#E8510A]/10 text-[#E8510A]'
                : 'border-[var(--a-border)] bg-[var(--a-card)] text-[var(--a-text)] hover:border-[#E8510A]/40'
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {hasFilters && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E8510A] text-[10px] font-bold text-white">
                {[search, statusFilter, serviceFilter, dateFrom, dateTo].filter(Boolean).length}
              </span>
            )}
          </button>
        }
      />

      {/* Summary cards */}
      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard 
            label="Total Bookings" 
            value={stats.total_bookings} 
            icon={<Calendar className="h-3.5 w-3.5" />} 
          />
          <StatCard 
            label="Pending Payment" 
            value={stats.pending_payment} 
            icon={<AlertCircle className="h-3.5 w-3.5 text-[#E8510A]" />} 
            className="border-[#E8510A]/25"
          />
          <StatCard 
            label="Paid" 
            value={stats.paid} 
            icon={<Check className="h-3.5 w-3.5 text-blue-500" />} 
          />
          <StatCard 
            label="Booked" 
            value={stats.booked} 
            icon={<CalendarCheck className="h-3.5 w-3.5 text-[#5A9E28]" />} 
          />
          <StatCard 
            label="Total Revenue" 
            value={`KES ${Number(stats.total_revenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={<DollarSign className="h-3.5 w-3.5 text-[#5A9E28]" />} 
            className="border-[#5A9E28]/25"
          />
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-4 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative sm:col-span-2 xl:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--a-placeholder)]" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search reference, name, email, phone..."
                className="h-9 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] pl-9 pr-3 text-sm focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-sm focus:border-[#E8510A] focus:outline-none"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={serviceFilter}
              onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}
              className="h-9 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-sm focus:border-[#E8510A] focus:outline-none"
            >
              <option value="">All services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2 sm:col-span-2 xl:col-span-1">
              <DatePicker
                value={dateFrom}
                onSelect={(v) => { setDateFrom(v); setPage(1); }}
                placeholder="From"
                disablePast={false}
                clearable
                className="h-9"
              />
              <DatePicker
                value={dateTo}
                onSelect={(v) => { setDateTo(v); setPage(1); }}
                placeholder="To"
                disablePast={false}
                clearable
                className="h-9"
              />
            </div>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { 
                setSearch(''); 
                setStatusFilter(''); 
                setServiceFilter(''); 
                setDateFrom(''); 
                setDateTo(''); 
                setPage(1); 
              }}
              className="mt-2 text-xs font-semibold text-[#E8510A] hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {loading ? (
          <Loading label="Loading bookings…" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--a-border-soft)] bg-[var(--a-subtle)]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <Th key={header.id}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </Th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-[var(--a-border-soft)]">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-[var(--a-subtle)]">
                    {row.getVisibleCells().map((cell) => (
                      <Td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && (
              <p className="px-6 py-14 text-center text-sm text-[var(--a-muted)]">No bookings match your filters.</p>
            )}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[var(--a-border-soft)] px-5 py-3">
          <span className="text-xs text-[var(--a-muted)]">
            Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of{' '}
            {total.toLocaleString()} booking{total === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-8 items-center gap-1 rounded-lg border border-[var(--a-border)] px-3 text-xs font-semibold text-[var(--a-text)] transition-colors hover:border-[#E8510A]/40 hover:text-[#E8510A] disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-xs text-[var(--a-muted)]">Page {page} of {pages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="flex h-8 items-center gap-1 rounded-lg border border-[var(--a-border)] px-3 text-xs font-semibold text-[var(--a-text)] transition-colors hover:border-[#E8510A]/40 hover:text-[#E8510A] disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => { if (!deleting) { setDeleteTarget(null); setCancelReason(''); setCancelSendEmail(true); } }}
        title="Cancel Booking"
        footer={
          <>
            <button
              type="button"
              onClick={() => { setDeleteTarget(null); setCancelReason(''); setCancelSendEmail(true); }}
              disabled={deleting}
              className="rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 py-2 text-sm font-semibold text-[var(--a-text)] transition-colors hover:border-[var(--a-border-soft)] disabled:opacity-50"
            >
              Keep Booking
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || !cancelReason.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancel Booking
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DC2626]/10">
              <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--a-ink2)]">
                Are you sure you want to cancel booking <span className="font-mono font-semibold">{deleteTarget?.reference}</span>?
              </p>
              <p className="text-sm text-[var(--a-muted)]">
                This action is irreversible. The booking status will be set to &ldquo;cancelled&rdquo; and any associated scheduling will be removed.
              </p>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Reason for cancellation *</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="e.g. Client requested to reschedule, duplicate booking, etc."
              className="w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 py-2 text-[13px] text-[var(--a-ink)] placeholder-[var(--a-muted)] focus:border-[#DC2626] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 resize-none"
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={cancelSendEmail}
              onChange={(e) => setCancelSendEmail(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--a-border)] accent-[#DC2626]"
            />
            <span className="text-[13px] text-[var(--a-ink2)]">Send cancellation email to customer</span>
          </label>
        </div>
      </Modal>
    </>
  );
}

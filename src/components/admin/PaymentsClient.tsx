'use client';

import * as React from 'react';
import { formatDate as format } from '@/lib/date-utils';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Banknote, Check, ChevronLeft, ChevronRight, Filter, Search, X } from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import { ErrorBanner, Loading, PageHeader, StatusPill, Td, Th } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

interface PaymentRow {
  id: string;
  checkout_request_id: string | null;
  mpesa_receipt: string | null;
  phone_number: string | null;
  amount: number;
  status: string;
  result_code: string | null;
  result_desc: string | null;
  created_at: string;
  session: {
    id: string;
    full_name: string;
    business_name: string | null;
    health_check_id: string;
    check_name: string;
  } | null;
}

interface Summary {
  total: number;
  totalAmount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  successAmount: number;
  byCheck: Array<{ name: string; count: number; amount: number }>;
}

interface HealthCheck {
  id: string;
  name: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
];

function StatCard({ label, value, icon, className }: { label: string; value: string | number; icon?: React.ReactNode; className?: string }) {
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

export function PaymentsClient() {
  const [payments, setPayments] = React.useState<PaymentRow[]>([]);
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [healthChecks, setHealthChecks] = React.useState<HealthCheck[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [healthCheckFilter, setHealthCheckFilter] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);

  const PAGE_SIZE = 50;

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (search) params.set('receipt', search);
      if (statusFilter) params.set('status', statusFilter);
      if (healthCheckFilter) params.set('health_check_id', healthCheckFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo + 'T23:59:59Z');

      const data = await adminFetch<{
        payments: PaymentRow[];
        summary: Summary;
        pagination: { total: number };
      }>(`/api/admin/payments?${params.toString()}`);

      setPayments(data.payments);
      setSummary(data.summary);
      setTotal(data.pagination.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, healthCheckFilter, dateFrom, dateTo]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Load health checks for the filter dropdown.
  React.useEffect(() => {
    adminFetch<{ checks: HealthCheck[] }>('/api/admin/health-checks')
      .then((data) => setHealthChecks(data.checks ?? []))
      .catch(() => {});
  }, []);

  const columns = React.useMemo<ColumnDef<PaymentRow>[]>(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ getValue }) => format(new Date(getValue() as string), 'dd MMM yyyy, HH:mm'),
      },
      {
        accessorKey: 'session.full_name',
        header: 'Name',
        cell: ({ row }) => row.original.session?.full_name ?? '—',
      },
      {
        accessorKey: 'session.check_name',
        header: 'Health Check',
        cell: ({ row }) => row.original.session?.check_name ?? '—',
      },
      {
        accessorKey: 'phone_number',
        header: 'Phone',
        cell: ({ getValue }) => <span className="font-mono text-xs">{(getValue() as string) ?? '—'}</span>,
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ getValue }) => <span className="font-semibold">KES {Number(getValue() ?? 0).toLocaleString()}</span>,
        meta: { align: 'right' },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const s = getValue() as string;
          const tone = s === 'success' ? 'green' : s === 'failed' ? 'red' : s === 'pending' ? 'amber' : 'grey';
          return <StatusPill tone={tone}>{s}</StatusPill>;
        },
      },
      {
        accessorKey: 'mpesa_receipt',
        header: 'Receipt',
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          return v ? <span className="font-mono text-xs font-semibold text-[#5A9E28]">{v}</span> : <span className="text-[var(--a-muted)]">—</span>;
        },
      },
      {
        accessorKey: 'checkout_request_id',
        header: 'Checkout Ref',
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          return v ? <span className="font-mono text-[10px] text-[var(--a-muted)]">{v.length > 20 ? v.slice(0, 20) + '…' : v}</span> : '—';
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: payments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = search || statusFilter || healthCheckFilter || dateFrom || dateTo;

  return (
    <>
      <PageHeader
        title="M-Pesa Payments"
        subtitle="Transaction log with receipt tracking and health check breakdown."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Payments' }]}
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
                {[search, statusFilter, healthCheckFilter, dateFrom, dateTo].filter(Boolean).length}
              </span>
            )}
          </button>
        }
      />

      {/* Summary cards */}
      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Transactions" value={summary.total} icon={<Banknote className="h-3.5 w-3.5" />} />
          <StatCard label="Total Amount" value={`KES ${Number(summary.totalAmount ?? 0).toLocaleString()}`} icon={<Banknote className="h-3.5 w-3.5 text-[#5A9E28]" />} className="border-[#5A9E28]/25" />
          <StatCard label="Successful" value={summary.successCount} icon={<Check className="h-3.5 w-3.5 text-[#5A9E28]" />} />
          <StatCard label="Failed" value={summary.failedCount} icon={<X className="h-3.5 w-3.5 text-red-500" />} />
          <StatCard label="Revenue (Success)" value={`KES ${Number(summary.successAmount ?? 0).toLocaleString()}`} icon={<Banknote className="h-3.5 w-3.5 text-[#E8510A]" />} className="border-[#E8510A]/25" />
        </div>
      )}

      {/* Health check breakdown */}
      {summary && summary.byCheck.length > 0 && (
        <div className="mb-6 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--a-ink2)]">Breakdown by Health Check</h3>
          <div className="flex flex-wrap gap-3">
            {summary.byCheck.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setHealthCheckFilter(healthCheckFilter === item.name ? '' : item.name)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  healthCheckFilter === item.name
                    ? 'border-[#E8510A] bg-[#E8510A] text-white'
                    : 'border-[var(--a-border)] bg-[var(--a-subtle)] text-[var(--a-text2)] hover:border-[#E8510A]/40'
                )}
              >
                {item.name} — {item.count} txns, KES {item.amount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-4 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--a-placeholder)]" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search receipt…"
                className="h-9 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] pl-9 pr-3 text-sm focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-sm focus:border-[#E8510A] focus:outline-none"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={healthCheckFilter}
              onChange={(e) => { setHealthCheckFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-sm focus:border-[#E8510A] focus:outline-none"
            >
              <option value="">All health checks</option>
              {healthChecks.map((hc) => (
                <option key={hc.id} value={hc.id}>{hc.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="h-9 flex-1 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-2 text-sm focus:border-[#E8510A] focus:outline-none"
                placeholder="From"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="h-9 flex-1 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-2 text-sm focus:border-[#E8510A] focus:outline-none"
                placeholder="To"
              />
            </div>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(''); setStatusFilter(''); setHealthCheckFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}
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
          <Loading label="Loading payments…" />
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
            {payments.length === 0 && (
              <p className="px-6 py-14 text-center text-sm text-[var(--a-muted)]">No payments match your filters.</p>
            )}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[var(--a-border-soft)] px-5 py-3">
          <span className="text-xs text-[var(--a-muted)]">
            Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of{' '}
            {total.toLocaleString()} payment{total === 1 ? '' : 's'}
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
    </>
  );
}

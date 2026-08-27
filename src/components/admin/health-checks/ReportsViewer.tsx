'use client';

import * as React from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Check, Columns, Copy, ExternalLink, Eye, Loader2, Mail, Pencil, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch, adminPut } from '@/lib/admin-client';
import { LexicalRenderer } from '@/features/lexical/LexicalRenderer';
import { ErrorBanner, Loading, Modal, PageHeader, StatusPill, Td, Th, Toggle } from '@/components/admin/ui';

interface ReportRow {
  id: string;
  report_type: 'summary' | 'detailed';
  is_paid: boolean;
  delivery_status: 'pending' | 'sent' | 'failed' | 'skipped';
  created_at: string;
  session_name: string;
  check_name: string;
  report_url_token: string;
  tokens_used?: number;
  generation_seconds?: number;
  model_used?: string | null;
  generation_error?: string | null;
}

interface ReportDetail {
  id: string;
  report_type: 'summary' | 'detailed';
  lexical_state: Record<string, unknown>;
  is_paid: boolean;
  delivery_status: string;
  created_at: string;
  session_name: string;
  check_name: string;
  report_url_token?: string | null;
  model_used?: string | null;
  generation_error?: string | null;
  tokens_used?: number;
  generation_seconds?: number;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const DELIVERY_TONE: Record<ReportRow['delivery_status'], 'amber' | 'green' | 'red' | 'grey'> = {
  pending: 'amber',
  sent: 'green',
  failed: 'red',
  skipped: 'grey',
};

export function ReportsViewer() {
  const [reports, setReports] = React.useState<ReportRow[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [reportType, setReportType] = React.useState('all');
  const [delivery, setDelivery] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({});
  const [showColumns, setShowColumns] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [canTogglePaid, setCanTogglePaid] = React.useState(false);

  const [viewId, setViewId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<ReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [regeneratingId, setRegeneratingId] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [errorViewReport, setErrorViewReport] = React.useState<ReportRow | null>(null);

  // Regeneration modal
  const [regenReport, setRegenReport] = React.useState<ReportRow | null>(null);
  const [regenSendEmail, setRegenSendEmail] = React.useState(true);

  // Resend email modal
  const [resendReport, setResendReport] = React.useState<ReportRow | null>(null);
  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendResult, setResendResult] = React.useState<{ ok: boolean; error?: string; to?: string } | null>(null);

  const copyLink = async (report: ReportRow) => {
    const url = `${window.location.origin}/business-health-checks/report/${report.report_url_token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(report.id);
      toast.success('Report link copied to clipboard');
      window.setTimeout(() => setCopiedId((id) => (id === report.id ? null : id)), 2000);
    } catch {
      toast.error('Could not copy link. Copy manually below.');
    }
  };

  const load = React.useCallback(async (targetPage: number, type: string, del: string, q: string, size: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: String(size) });
      if (type !== 'all') params.set('report_type', type);
      if (del !== 'all') params.set('delivery', del);
      if (q) params.set('search', q);
      const { reports: rows, pagination } = await adminFetch<{ reports: ReportRow[]; pagination: { total: number } }>(
        `/api/admin/health-checks/reports?${params.toString()}`
      );
      setReports(rows);
      setTotal(pagination.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [page, reportType, delivery, searchQuery, pageSize]);

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchQuery(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    void load(page, reportType, delivery, searchQuery, pageSize);
  }, [load, page, reportType, delivery, searchQuery, pageSize]);

  React.useEffect(() => {
    adminFetch<{ admin: { role: string } }>('/api/admin/me')
      .then(({ admin }) => setCanTogglePaid(admin.role === 'super_admin' || admin.role === 'admin'))
      .catch(() => setCanTogglePaid(false));
  }, []);

  const togglePaid = async (report: ReportRow) => {
    try {
      await adminPut(`/api/admin/health-checks/reports/${report.id}`, { is_paid: !report.is_paid });
      setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, is_paid: !r.is_paid } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update payment status.');
    }
  };

  const openView = async (reportId: string) => {
    setViewId(reportId);
    setDetailLoading(true);
    try {
      const { report } = await adminFetch<{ report: ReportDetail }>(`/api/admin/health-checks/reports/${reportId}`);
      setDetail(report);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load report.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRegenerate = async (report: ReportRow) => {
    setRegenReport(report);
    setRegenSendEmail(true);
  };

  const executeRegenerate = async () => {
    if (!regenReport) return;
    setRegeneratingId(regenReport.id);
    try {
      await adminFetch(`/api/admin/health-checks/reports/${regenReport.id}/regenerate`, {
        method: 'POST',
        body: JSON.stringify({ sendEmail: regenSendEmail }),
      });
      toast.success(regenSendEmail ? 'Report regenerated and email sent' : 'Report regenerated without sending email');
      setRegenReport(null);
      void load(page, reportType, delivery, searchQuery, pageSize);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to regenerate report.');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleResendEmail = async () => {
    if (!resendReport) return;
    setResendLoading(true);
    setResendResult(null);
    try {
      const result = await adminFetch<{ ok: boolean; error?: string; to?: string }>(
        `/api/admin/health-checks/reports/${resendReport.id}/resend`,
        { method: 'POST' }
      );
      setResendResult(result);
      if (result.ok) {
        toast.success(`Email resent to ${result.to}`);
        void load(page, reportType, delivery, searchQuery, pageSize);
      }
    } catch (e) {
      setResendResult({ ok: false, error: e instanceof Error ? e.message : 'Failed to resend email.' });
    } finally {
      setResendLoading(false);
    }
  };

  const columns = React.useMemo<ColumnDef<ReportRow>[]>(
    () => [
      { accessorKey: 'session_name', header: 'Name' },
      { accessorKey: 'check_name', header: 'Check' },
      {
        accessorKey: 'report_type',
        header: 'Type',
        cell: ({ getValue }) => (
          <StatusPill tone={getValue() === 'detailed' ? 'orange' : 'blue'}>{getValue() as string}</StatusPill>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Generated',
        cell: ({ getValue }) => format(new Date(getValue() as string), 'dd MMM yyyy, HH:mm'),
      },
      {
        accessorKey: 'is_paid',
        header: 'Paid',
        cell: ({ row }) => (
          <Toggle checked={row.original.is_paid} onChange={() => togglePaid(row.original)} disabled={!canTogglePaid} label="Paid" />
        ),
      },
      {
        accessorKey: 'delivery_status',
        header: 'Delivery',
        cell: ({ getValue }) => <StatusPill tone={DELIVERY_TONE[getValue() as ReportRow['delivery_status']]}>{getValue() as string}</StatusPill>,
      },
      {
        id: 'gen_status',
        header: 'Gen Status',
        cell: ({ row }) => {
          const err = row.original.generation_error;
          const model = row.original.model_used;
          if (err) {
            return (
              <button
                type="button"
                onClick={() => setErrorViewReport(row.original)}
                className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-600/20 transition-colors hover:bg-red-100"
              >
                Fallback
              </button>
            );
          }
          if (model === 'fallback') {
            return (
              <button
                type="button"
                onClick={() => setErrorViewReport(row.original)}
                className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20 transition-colors hover:bg-amber-100"
              >
                Fallback
              </button>
            );
          }
          return model ? (
            <span className="text-[12px] text-[var(--a-muted)]">{model}</span>
          ) : (
            <span className="text-[12px] text-[var(--a-muted)]">—</span>
          );
        },
      },
      {
        accessorKey: 'tokens_used',
        header: 'Tokens used',
        cell: ({ row }) => row.original.tokens_used != null ? String(row.original.tokens_used) : '-',
      },
      {
        accessorKey: 'generation_seconds',
        header: 'Gen time (s)',
        cell: ({ row }) => row.original.generation_seconds != null ? String(Math.round(row.original.generation_seconds)) : '-',
      },
      {
        id: 'edit',
        header: '',
        cell: ({ row }) => (
          <Link
            href={`/admin/health-checks/reports/${row.original.id}/edit`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-[var(--a-text2)] transition-colors hover:bg-[#E8510A]/10 hover:text-[#E8510A]"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
        ),
      },
      {
        id: 'view',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => openView(row.original.id)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-[#E8510A] hover:bg-[#E8510A]/10"
          >
            <Eye className="h-3.5 w-3.5" /> View
          </button>
        ),
      },
      {
        id: 'link',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => copyLink(row.original)}
            title="Copy public report link"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-[var(--a-text2)] transition-colors hover:bg-[#E8510A]/10 hover:text-[#E8510A]"
          >
            {copiedId === row.original.id ? (
              <Check className="h-3.5 w-3.5 text-[#5A9E28]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copiedId === row.original.id ? 'Copied' : 'Link'}
          </button>
        ),
      },
      {
        id: 'resend',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => {
              setResendReport(row.original);
              setResendResult(null);
            }}
            title="Resend report email"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-[var(--a-text2)] transition-colors hover:bg-blue-500/10 hover:text-blue-600"
          >
            <Mail className="h-3.5 w-3.5" /> Resend
          </button>
        ),
      },
      {
        id: 'regenerate',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => handleRegenerate(row.original)}
            disabled={regeneratingId === row.original.id}
            title="Regenerate report"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-[var(--a-text2)] transition-colors hover:bg-[#5A9E28]/10 hover:text-[#3f7a1a] disabled:opacity-50"
          >
            {regeneratingId === row.original.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Regenerate
          </button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canTogglePaid, regeneratingId, handleRegenerate, copyLink, copiedId]
  );

  const table = useReactTable({
    data: reports,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const toggleableColumns = React.useMemo(
    () => ['session_name', 'check_name', 'report_type', 'created_at', 'is_paid', 'delivery_status', 'gen_status'],
    []
  );

  const pages = Math.max(1, Math.ceil(total / pageSize));

  if (error) return <ErrorBanner message={error} />;

  return (
    <>
      <PageHeader
        title="Health Check Reports"
        subtitle="Generated reports. Payment status can be toggled by super admins and admins."
        crumbs={[{ label: 'Health Checks', href: '/admin/health-checks' }, { label: 'Reports' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--a-muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, business, check…"
                className="h-9 w-64 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] pl-9 pr-3 text-sm placeholder:text-[var(--a-muted)] focus:border-[#E8510A] focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--a-muted)] hover:text-[var(--a-ink)]"
                  aria-label="Clear search"
                >
                  <span className="text-base leading-none">×</span>
                </button>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumns((v) => !v)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-sm font-semibold text-[var(--a-ink2)] hover:bg-[var(--a-hover)]"
              >
                <Columns className="h-3.5 w-3.5" /> Columns
              </button>
              {showColumns && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowColumns(false)} />
                  <div className="absolute right-0 top-11 z-30 w-52 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                    <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--a-muted)]">Show columns</p>
                    {toggleableColumns.map((colId) => {
                      const column = table.getColumn(colId);
                      if (!column) return null;
                      const label = {
                        session_name: 'Name',
                        check_name: 'Check',
                        report_type: 'Type',
                        created_at: 'Generated',
                        is_paid: 'Paid',
                        delivery_status: 'Delivery',
                        gen_status: 'Gen Status',
                      }[colId];
                      return (
                        <label key={colId} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--a-ink2)] hover:bg-[var(--a-hover)]">
                          <input
                            type="checkbox"
                            checked={column.getIsVisible()}
                            onChange={column.getToggleVisibilityHandler()}
                            className="h-3.5 w-3.5 accent-[#E8510A]"
                          />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-sm focus:border-[#E8510A] focus:outline-none"
            >
              <option value="all">All types</option>
              <option value="summary">Summary</option>
              <option value="detailed">Detailed</option>
            </select>
            <select
              value={delivery}
              onChange={(e) => {
                setDelivery(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-sm focus:border-[#E8510A] focus:outline-none"
            >
              <option value="all">All delivery</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
        }
      />

      <div className="overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {loading ? (
          <Loading label="Loading reports…" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--a-subtle)]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <Th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</Th>
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
            {reports.length === 0 && <p className="px-6 py-14 text-center text-sm text-[var(--a-muted)]">No reports match your filters.</p>}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[var(--a-border-soft)] px-5 py-3">
          <div className="flex items-center gap-3">
            <p className="text-xs text-[var(--a-muted)]">
              {total.toLocaleString()} report{total === 1 ? '' : 's'} · page {page} of {pages}
            </p>
            <div className="flex items-center gap-1.5">
              <label htmlFor="page-size" className="text-xs text-[var(--a-muted)]">Show</label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-7 rounded-md border border-[var(--a-border)] bg-[var(--a-card)] px-1.5 text-xs font-semibold text-[var(--a-ink2)] focus:border-[#E8510A] focus:outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-[var(--a-border)] px-3 py-1.5 text-xs font-semibold text-[var(--a-text)] hover:border-[#E8510A]/40 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="rounded-md border border-[var(--a-border)] px-3 py-1.5 text-xs font-semibold text-[var(--a-text)] hover:border-[#E8510A]/40 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Report viewer modal */}
      <Modal
        open={viewId !== null}
        onClose={() => setViewId(null)}
        title={detail ? `${detail.check_name} — ${detail.report_type} report` : 'Report'}
        wide
        footer={
          <button type="button" onClick={() => setViewId(null)} className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)]">
            Close
          </button>
        }
      >
        {detailLoading || !detail ? (
          <Loading label="Loading report…" />
        ) : (
          <div className="space-y-4">
            {(() => {
              const reportUrlToken =
                detail.report_url_token ??
                reports.find((r) => r.id === detail.id)?.report_url_token ??
                '';
              return (
            <>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--a-muted)]">
              <span className="font-semibold text-[var(--a-ink2)]">{detail.session_name}</span>
              · {detail.check_name}
              · {format(new Date(detail.created_at), 'd MMM yyyy')}
              <StatusPill tone={detail.is_paid ? 'green' : 'grey'}>{detail.is_paid ? 'Paid' : 'Unpaid'}</StatusPill>
              <StatusPill tone={DELIVERY_TONE[detail.delivery_status as ReportRow['delivery_status']] ?? 'amber'}>{detail.delivery_status}</StatusPill>
              {detail.model_used === 'fallback' && (
                <StatusPill tone="amber">fallback</StatusPill>
              )}
              {detail.tokens_used != null && (
                <span className="text-[12px]">{detail.tokens_used} tokens</span>
              )}
              {detail.generation_seconds != null && (
                <span className="text-[12px]">{Math.round(detail.generation_seconds)}s</span>
              )}
            </div>
            {detail.generation_error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-red-700">Generation Error</p>
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-red-800">{detail.generation_error}</p>
                <p className="mt-2 text-[11px] text-red-600">The fallback report was used instead. Regenerate after fixing the issue.</p>
              </div>
            )}
            <div className="rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-card)] p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--a-muted)]">Report link</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  readOnly
                  value={`${window.location.origin}/business-health-checks/report/${reportUrlToken}`}
                  className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3 text-[12px] text-[var(--a-muted)] focus:outline-none"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(`${window.location.origin}/business-health-checks/report/${reportUrlToken}`)
                      .then(() => toast.success('Report link copied'))
                      .catch(() => toast.error('Could not copy. Copy the link above manually.'));
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#E8510A] px-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#d34a08]"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
                <a
                  href={`/business-health-checks/report/${reportUrlToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-[12px] font-semibold text-[var(--a-text)] transition-colors hover:border-[#E8510A]/40 hover:text-[#E8510A]"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open
                </a>
              </div>
              <p className="mt-2 text-[11px] text-[var(--a-muted)]">
                Share this link with the client to view or download the report without logging in.
              </p>
            </div>
            <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-card)] p-6">
              <LexicalRenderer state={detail.lexical_state} />
            </div>
            </>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* Generation error modal */}
      <Modal
        open={errorViewReport !== null}
        onClose={() => setErrorViewReport(null)}
        title="Generation Error"
        footer={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setErrorViewReport(null)}
              className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)]"
            >
              Close
            </button>
            {errorViewReport && (
              <button
                type="button"
                onClick={() => {
                  const rpt = errorViewReport;
                  setErrorViewReport(null);
                  void handleRegenerate(rpt);
                }}
                className="h-10 rounded-lg bg-[#E8510A] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#d34a08]"
              >
                Regenerate Report
              </button>
            )}
          </div>
        }
      >
        {errorViewReport && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--a-muted)]">
              <span className="font-semibold text-[var(--a-ink2)]">{errorViewReport.session_name}</span>
              · {errorViewReport.check_name}
              · {format(new Date(errorViewReport.created_at), 'd MMM yyyy')}
              <StatusPill tone={errorViewReport.is_paid ? 'green' : 'grey'}>{errorViewReport.is_paid ? 'Paid' : 'Unpaid'}</StatusPill>
              <StatusPill tone={DELIVERY_TONE[errorViewReport.delivery_status]}>{errorViewReport.delivery_status}</StatusPill>
              {errorViewReport.model_used === 'fallback' && (
                <StatusPill tone="amber">fallback</StatusPill>
              )}
            </div>
            {errorViewReport.generation_error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-red-700">Error Message</p>
                <pre className="mt-3 whitespace-pre-wrap rounded-md bg-white p-4 text-[13px] leading-relaxed text-red-800 ring-1 ring-red-200">
                  {errorViewReport.generation_error}
                </pre>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Fallback Used</p>
                <p className="mt-2 text-[13px] text-amber-800">
                  No error was recorded, but the model used was <span className="font-semibold">{errorViewReport.model_used ?? 'unknown'}</span>.
                  The deterministic fallback template was used instead of AI generation.
                </p>
              </div>
            )}
            {errorViewReport.tokens_used != null && (
              <p className="text-[12px] text-[var(--a-muted)]">Tokens used: {errorViewReport.tokens_used}</p>
            )}
            {errorViewReport.generation_seconds != null && (
              <p className="text-[12px] text-[var(--a-muted)]">Generation time: {Math.round(errorViewReport.generation_seconds)}s</p>
            )}
          </div>
        )}
      </Modal>

      {/* Regeneration modal with email checkbox */}
      <Modal
        open={regenReport !== null}
        onClose={() => setRegenReport(null)}
        title="Regenerate Report"
        footer={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRegenReport(null)}
              disabled={regeneratingId === regenReport?.id}
              className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void executeRegenerate()}
              disabled={regeneratingId === regenReport?.id}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#E8510A] px-5 text-[13px] font-bold text-white transition-colors hover:bg-[#c94508] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {regeneratingId === regenReport?.id && <Loader2 className="h-4 w-4 animate-spin" />}
              {regeneratingId === regenReport?.id ? 'Regenerating…' : 'Regenerate'}
            </button>
          </div>
        }
      >
        {regenReport && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-[var(--a-text)]">
              Regenerate the <span className="font-semibold">{regenReport.report_type}</span> report for{' '}
              <span className="font-semibold">&ldquo;{regenReport.session_name}&rdquo;</span>?
              This replaces the existing report content.
            </p>
            <label className="flex items-start gap-3 rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] p-4 cursor-pointer hover:bg-[var(--a-hover)]">
              <input
                type="checkbox"
                checked={regenSendEmail}
                onChange={(e) => setRegenSendEmail(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#E8510A]"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--a-ink)]">Send email after regeneration</p>
                <p className="mt-0.5 text-[12px] text-[var(--a-muted)]">
                  Deliver the regenerated report to {regenReport.session_name}&apos;s email address.
                </p>
              </div>
            </label>
          </div>
        )}
      </Modal>

      {/* Resend email modal */}
      <Modal
        open={resendReport !== null}
        onClose={() => setResendReport(null)}
        title="Resend Report Email"
        footer={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setResendReport(null)}
              disabled={resendLoading}
              className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)] disabled:opacity-50"
            >
              {resendResult?.ok ? 'Close' : 'Cancel'}
            </button>
            {!resendResult?.ok && (
              <button
                type="button"
                onClick={() => void handleResendEmail()}
                disabled={resendLoading}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#E8510A] px-5 text-[13px] font-bold text-white transition-colors hover:bg-[#c94508] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resendLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {resendLoading ? 'Sending…' : 'Send Email'}
              </button>
            )}
          </div>
        }
      >
        {resendReport && (
          <div className="space-y-4">
            {resendResult ? (
              resendResult.ok ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-800">Email sent successfully</p>
                  <p className="mt-1 text-[13px] text-green-700">
                    Report email resent to <span className="font-medium">{resendResult.to}</span>.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-800">Failed to send email</p>
                  <p className="mt-1 text-[13px] text-red-700">{resendResult.error}</p>
                </div>
              )
            ) : (
              <>
                <div className="rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--a-muted)] w-20 shrink-0">Report</span>
                    <span className="font-semibold text-[var(--a-ink)]">{resendReport.session_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--a-muted)] w-20 shrink-0">Check</span>
                    <span className="text-[var(--a-ink2)]">{resendReport.check_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--a-muted)] w-20 shrink-0">Type</span>
                    <StatusPill tone={resendReport.report_type === 'detailed' ? 'orange' : 'blue'}>{resendReport.report_type}</StatusPill>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--a-muted)] w-20 shrink-0">Delivery</span>
                    <StatusPill tone={DELIVERY_TONE[resendReport.delivery_status]}>{resendReport.delivery_status}</StatusPill>
                  </div>
                </div>
                <p className="text-[13px] text-[var(--a-muted)]">
                  This will re-send the report email to the client. The admin will also be CC&apos;d.
                </p>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

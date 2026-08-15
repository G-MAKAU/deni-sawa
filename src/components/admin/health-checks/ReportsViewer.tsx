'use client';

import * as React from 'react';
import { format } from 'date-fns';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Eye, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch, adminPost, adminPut } from '@/lib/admin-client';
import { useConfirm } from '@/components/admin/confirm';
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
}

const PAGE_SIZE = 20;

const DELIVERY_TONE: Record<ReportRow['delivery_status'], 'amber' | 'green' | 'red' | 'grey'> = {
  pending: 'amber',
  sent: 'green',
  failed: 'red',
  skipped: 'grey',
};

export function ReportsViewer() {
  const confirm = useConfirm();
  const [reports, setReports] = React.useState<ReportRow[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [reportType, setReportType] = React.useState('all');
  const [delivery, setDelivery] = React.useState('all');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [canTogglePaid, setCanTogglePaid] = React.useState(false);

  const [viewId, setViewId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<ReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [regeneratingId, setRegeneratingId] = React.useState<string | null>(null);

  const load = React.useCallback(async (targetPage: number, type: string, del: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
      if (type !== 'all') params.set('report_type', type);
      if (del !== 'all') params.set('delivery', del);
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
  }, []);

  React.useEffect(() => {
    void load(page, reportType, delivery);
  }, [load, page, reportType, delivery]);

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
    try {
      const ok = await confirm({
        message: `Regenerate the ${report.report_type} report for "${report.session_name}"? This replaces the existing report and re-sends it.`,
        danger: false,
        confirmLabel: 'Regenerate',
        action: async () => {
          setRegeneratingId(report.id);
          await adminPost(`/api/admin/health-checks/reports/${report.id}/regenerate`, {});
        },
      });
      if (!ok) return;
      toast.success('Report regenerated and delivery re-triggered');
      void load(page, reportType, delivery);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to regenerate report.');
    } finally {
      setRegeneratingId(null);
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
    [canTogglePaid, regeneratingId, handleRegenerate]
  );

  const table = useReactTable({
    data: reports,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (error) return <ErrorBanner message={error} />;

  return (
    <>
      <PageHeader
        title="Health Check Reports"
        subtitle="Generated reports. Payment status can be toggled by super admins and admins."
        crumbs={[{ label: 'Health Checks', href: '/admin/health-checks' }, { label: 'Reports' }]}
        actions={
          <div className="flex items-center gap-2">
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
              <thead className="border-b border-[var(--a-border-soft)] bg-[var(--a-subtle)]">
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
          <p className="text-xs text-[var(--a-muted)]">
            {total.toLocaleString()} report{total === 1 ? '' : 's'} · page {page} of {pages}
          </p>
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
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--a-muted)]">
              <span className="font-semibold text-[var(--a-ink2)]">{detail.session_name}</span>
              · {detail.check_name}
              · {format(new Date(detail.created_at), 'd MMM yyyy')}
              <StatusPill tone={detail.is_paid ? 'green' : 'grey'}>{detail.is_paid ? 'Paid' : 'Unpaid'}</StatusPill>
              <StatusPill tone={DELIVERY_TONE[detail.delivery_status as ReportRow['delivery_status']] ?? 'amber'}>{detail.delivery_status}</StatusPill>
            </div>
            <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-card)] p-6">
              <LexicalRenderer state={detail.lexical_state} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

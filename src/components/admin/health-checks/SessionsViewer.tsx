'use client';

import * as React from 'react';
import { format } from 'date-fns';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Loader2, Search } from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import { ErrorBanner, Loading, Modal, PageHeader, StatusPill, Td, Th } from '@/components/admin/ui';

interface SessionRow {
  id: string;
  full_name: string;
  business_name: string | null;
  email: string | null;
  whatsapp: string | null;
  check_name: string;
  started_at: string;
  time_taken_seconds: number | null;
  is_complete: boolean;
  report_count: number;
}

interface SessionDetail {
  id: string;
  full_name: string;
  business_name: string | null;
  email: string | null;
  whatsapp: string | null;
  preferred_delivery: string;
  check_name: string;
  started_at: string;
  completed_at: string | null;
  time_taken_seconds: number | null;
  is_complete: boolean;
}

interface AnswerGroupQuestion {
  id: string;
  question_text: string;
  question_type: string;
  answer: string | null;
  has_answer: boolean;
}

interface AnswerGroupSubsection {
  id: string;
  heading: string;
  questions: AnswerGroupQuestion[];
}

interface AnswerGroupSection {
  id: string;
  title: string;
  subsections: AnswerGroupSubsection[];
}

interface SessionReport {
  id: string;
  report_type: 'summary' | 'detailed';
  delivery_status: string;
  is_paid: boolean;
  created_at: string;
}

const PAGE_SIZE = 20;

export function SessionsViewer() {
  const [sessions, setSessions] = React.useState<SessionRow[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<SessionDetail | null>(null);
  const [tree, setTree] = React.useState<AnswerGroupSection[]>([]);
  const [reports, setReports] = React.useState<SessionReport[]>([]);
  const [detailLoading, setDetailLoading] = React.useState(false);

  const load = React.useCallback(async (targetPage: number, searchTerm: string, statusFilter: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
      if (searchTerm) params.set('search', searchTerm);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const { sessions: rows, pagination } = await adminFetch<{ sessions: SessionRow[]; pagination: { total: number } }>(
        `/api/admin/health-checks/sessions?${params.toString()}`
      );
      setSessions(rows);
      setTotal(pagination.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load(page, search, status);
  }, [load, page, search, status]);

  const openSession = async (sessionId: string) => {
    setSelectedId(sessionId);
    setDetailLoading(true);
    try {
      const { session, tree: treeRows, reports: reportRows } = await adminFetch<{
        session: SessionDetail;
        tree: AnswerGroupSection[];
        reports: SessionReport[];
      }>(`/api/admin/health-checks/sessions/${sessionId}`);
      setDetail(session);
      setTree(treeRows);
      setReports(reportRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load session details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = React.useMemo<ColumnDef<SessionRow>[]>(
    () => [
      { accessorKey: 'full_name', header: 'Name' },
      { accessorKey: 'business_name', header: 'Business name' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'whatsapp', header: 'WhatsApp' },
      { accessorKey: 'check_name', header: 'Check' },
      {
        accessorKey: 'started_at',
        header: 'Started',
        cell: ({ getValue }) => format(new Date(getValue() as string), 'dd MMM, HH:mm'),
      },
      {
        accessorKey: 'time_taken_seconds',
        header: 'Time taken',
        cell: ({ getValue }) => {
          const seconds = getValue() as number | null;
          if (!seconds) return '—';
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${mins}m ${secs}s`;
        },
      },
      {
        accessorKey: 'is_complete',
        header: 'Complete',
        cell: ({ getValue }) => (
          <StatusPill tone={getValue() ? 'green' : 'amber'}>{getValue() ? 'Complete' : 'In progress'}</StatusPill>
        ),
      },
      {
        accessorKey: 'report_count',
        header: 'Reports',
        cell: ({ getValue }) => <span className="font-semibold">{getValue() as number}</span>,
      },
    ],
    []
  );

  const table = useReactTable({
    data: sessions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (error) return <ErrorBanner message={error} />;

  return (
    <>
      <PageHeader
        title="Health Check Sessions"
        subtitle="All assessments started by visitors."
        crumbs={[{ label: 'Health Checks', href: '/admin/health-checks' }, { label: 'Sessions' }]}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--a-placeholder)]" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email…"
                className="h-9 w-56 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] pl-9 pr-3 text-sm focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-sm focus:border-[#E8510A] focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="complete">Complete</option>
              <option value="incomplete">In progress</option>
            </select>
          </div>
        }
      />

      <div className="overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {loading ? (
          <Loading label="Loading sessions…" />
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
                  <tr
                    key={row.id}
                    onClick={() => openSession(row.original.id)}
                    className="cursor-pointer transition-colors hover:bg-[var(--a-subtle)]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <Td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {sessions.length === 0 && (
              <p className="px-6 py-14 text-center text-sm text-[var(--a-muted)]">No sessions match your filters.</p>
            )}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[var(--a-border-soft)] px-5 py-3">
          <p className="text-xs text-[var(--a-muted)]">
            {total.toLocaleString()} session{total === 1 ? '' : 's'} · page {page} of {pages}
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

      {/* Session detail modal */}
      <Modal
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        title="Session details"
        wide
        footer={
          <button type="button" onClick={() => setSelectedId(null)} className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)]">
            Close
          </button>
        }
      >
        {detailLoading || !detail ? (
          <Loading label="Loading answers…" />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] p-4 text-sm sm:grid-cols-2">
              <p>
                <span className="text-[var(--a-muted)]">Name:</span> <span className="font-semibold text-[var(--a-ink2)]">{detail.full_name}</span>
              </p>
              {detail.business_name && (
                <p>
                  <span className="text-[var(--a-muted)]">Business:</span> <span className="font-semibold text-[var(--a-ink2)]">{detail.business_name}</span>
                </p>
              )}
              <p>
                <span className="text-[var(--a-muted)]">Check:</span> <span className="font-semibold text-[var(--a-ink2)]">{detail.check_name}</span>
              </p>
              <p>
                <span className="text-[var(--a-muted)]">Delivery:</span> <span className="font-semibold text-[var(--a-ink2)]">{detail.preferred_delivery}</span>
              </p>
              <p>
                <span className="text-[var(--a-muted)]">Email:</span> <span className="text-[var(--a-ink2)]">{detail.email ?? '—'}</span>
              </p>
              <p>
                <span className="text-[var(--a-muted)]">WhatsApp:</span> <span className="text-[var(--a-ink2)]">{detail.whatsapp ?? '—'}</span>
              </p>
              <p>
                <span className="text-[var(--a-muted)]">Started:</span> <span className="text-[var(--a-ink2)]">{format(new Date(detail.started_at), 'd MMM yyyy, HH:mm')}</span>
              </p>
              <p>
                <span className="text-[var(--a-muted)]">Status:</span>{' '}
                <StatusPill tone={detail.is_complete ? 'green' : 'amber'}>{detail.is_complete ? 'Complete' : 'In progress'}</StatusPill>
              </p>
            </div>

            {reports.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {reports.map((report) => (
                  <span key={report.id} className="inline-flex items-center gap-2 rounded-full border border-[var(--a-border)] px-3 py-1 text-[11px] font-semibold text-[var(--a-text)]">
                    {report.report_type} report
                    <StatusPill tone={report.delivery_status === 'sent' ? 'green' : report.delivery_status === 'failed' ? 'red' : report.delivery_status === 'pending' ? 'amber' : 'grey'}>
                      {report.delivery_status}
                    </StatusPill>
                  </span>
                ))}
              </div>
            )}

            <div className="max-h-[50vh] space-y-5 overflow-y-auto pr-1">
              {tree.map((section) => (
                <div key={section.id}>
                  <h4 className="font-heading text-sm font-bold text-[#E8510A]">{section.title}</h4>
                  {section.subsections.map((subsection) => (
                    <div key={subsection.id} className="mt-3">
                      <h5 className="text-[13px] font-semibold text-[var(--a-ink2)]">{subsection.heading}</h5>
                      <div className="mt-1.5 space-y-1.5">
                        {subsection.questions.map((question) => (
                          <div key={question.id} className="rounded-md border border-[var(--a-border-soft)] bg-[var(--a-subtle)] px-3 py-2">
                            <p className="text-[13px] text-[var(--a-text)]">{question.question_text}</p>
                            <p className={question.has_answer ? 'mt-0.5 text-sm font-medium text-[var(--a-ink2)]' : 'mt-0.5 text-sm italic text-[var(--a-placeholder)]'}>
                              {question.answer ?? 'No answer'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

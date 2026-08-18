'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle2, Eye, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch, adminPut } from '@/lib/admin-client';
import { LexicalEditor } from '@/features/lexical/LexicalEditor';
import { LexicalRenderer } from '@/features/lexical/LexicalRenderer';
import { ErrorBanner, Loading, PageHeader, StatusPill } from '@/components/admin/ui';

interface ReportDetail {
  id: string;
  report_type: 'summary' | 'detailed';
  lexical_state: Record<string, unknown>;
  is_paid: boolean;
  delivery_status: string;
  created_at: string;
  edited_at: string | null;
  report_url_token: string;
  session_name: string;
  business_name: string | null;
  check_name: string;
  check_slug: string;
}

interface ReportEditorProps {
  reportId: string;
}

/** Full-page editor for a single generated report body. */
export function ReportEditor({ reportId }: ReportEditorProps) {
  const router = useRouter();
  const [report, setReport] = React.useState<ReportDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [editorState, setEditorState] = React.useState<Record<string, unknown> | null>(null);
  // Only render the editor once the real stored state has been loaded, so the
  // initial mount never flashes a blank document.
  const [editorReady, setEditorReady] = React.useState(false);
  const [view, setView] = React.useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = React.useState(false);
  const [savedFlash, setSavedFlash] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const { report: loaded } = await adminFetch<{ report: ReportDetail }>(`/api/admin/health-checks/reports/${reportId}`);
      setReport(loaded);
      setEditorState(loaded.lexical_state);
      setEditorReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!editorState) return;
    setSaving(true);
    try {
      const { report: updated } = await adminPut<{ report: ReportDetail }>(`/api/admin/health-checks/reports/${reportId}`, {
        lexical_state: editorState,
      });
      setReport(updated);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
      toast.success('Report saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save report.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Loading report…" />;
  if (error) return <ErrorBanner message={error} />;
  if (!report) return null;

  const reportTypeLabel = report.report_type === 'summary' ? 'Summary' : 'Detailed';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Edit Report"
        subtitle={`${report.check_name} — ${reportTypeLabel} report`}
        crumbs={[
          { label: 'Health Checks', href: '/admin/health-checks' },
          { label: 'Reports', href: '/admin/health-checks/reports' },
          { label: 'Edit' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/admin/health-checks/sessions')}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-sm font-semibold text-[var(--a-ink2)] transition-colors hover:bg-[var(--a-hover)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Sessions
            </button>
            <div className="flex h-9 items-center overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] text-sm font-semibold">
              <button
                type="button"
                onClick={() => setView('edit')}
                className={view === 'edit' ? 'bg-[#E8510A] px-3.5 py-2 text-white' : 'px-3.5 py-2 text-[var(--a-muted)] hover:text-[var(--a-ink2)]'}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setView('preview')}
                className={view === 'preview' ? 'flex items-center gap-1.5 bg-[#E8510A] px-3.5 py-2 text-white' : 'flex items-center gap-1.5 px-3.5 py-2 text-[var(--a-muted)] hover:text-[var(--a-ink2)]'}
              >
                <Eye className="h-3.5 w-3.5" /> Preview
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#E8510A] px-4 text-sm font-bold text-white transition-colors hover:bg-[#c94508] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : savedFlash ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? 'Saving…' : savedFlash ? 'Saved' : 'Save report'}
            </button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-card)] px-4 py-3 text-sm">
        <span className="font-semibold text-[var(--a-ink2)]">{report.session_name}</span>
        {report.business_name && (
          <>
            <span className="text-[var(--a-muted)]">·</span>
            <span className="text-[var(--a-ink2)]">{report.business_name}</span>
          </>
        )}
        <span className="text-[var(--a-muted)]">·</span>
        <span className="text-[var(--a-muted)]">{format(new Date(report.created_at), 'd MMM yyyy, HH:mm')}</span>
        <StatusPill tone={report.report_type === 'summary' ? 'blue' : 'orange'}>{reportTypeLabel}</StatusPill>
        <StatusPill tone={report.is_paid ? 'green' : 'grey'}>{report.is_paid ? 'Paid' : 'Unpaid'}</StatusPill>
        <StatusPill
          tone={
            report.delivery_status === 'sent' ? 'green' : report.delivery_status === 'failed' ? 'red' : report.delivery_status === 'pending' ? 'amber' : 'grey'
          }
        >
          {report.delivery_status}
        </StatusPill>
        {report.edited_at && <span className="text-xs text-[var(--a-muted)]">· last edited {format(new Date(report.edited_at), 'd MMM yyyy, HH:mm')}</span>}
      </div>

      <div className="min-h-0 flex-1">
        {view === 'edit' ? (
          editorReady && editorState ? (
            <LexicalEditor
              key={report.id}
              state={editorState}
              onChange={(state) => setEditorState(state as Record<string, unknown>)}
              placeholder="Edit the report content…"
              floatingToolbar
              className="min-h-0"
            />
          ) : (
            <div className="flex h-full min-h-[420px] items-center justify-center gap-2 text-sm text-[var(--a-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading content…
            </div>
          )
        ) : (
          <div className="h-full overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-card)]">
            <div className="h-full overflow-y-auto">
              <div className="mx-auto max-w-3xl px-6 py-8">
                <LexicalRenderer state={editorState ?? report.lexical_state} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { FileDown, FileText, Loader2, Lock, Sparkles } from 'lucide-react';
import { LexicalRenderer } from '@/features/lexical/LexicalRenderer';
import { ShareMenu } from '@/components/ShareMenu';
import { cn } from '@/lib/utils';

interface ReportData {
  id: string;
  session_id: string;
  report_type: 'summary' | 'detailed';
  lexical_state: Record<string, unknown>;
  is_paid: boolean;
  delivery_status: string;
  created_at: string;
  session_name: string;
  check_name: string;
}

export function ReportViewerV2({ token }: { token: string }) {
  const [report, setReport] = React.useState<ReportData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [downloading, setDownloading] = React.useState<'pdf' | 'word' | null>(null);
  const [generatingDetailed, setGeneratingDetailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/health-check/report/${token}`, { cache: 'no-store' });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? 'Report not found.');
        if (!cancelled) setReport(body.report as ReportData);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Report not found.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleExport = async (kind: 'pdf' | 'word') => {
    setDownloading(kind);
    try {
      const res = await fetch(`/api/reports/export/${kind}/${token}`, { method: 'POST' });
      if (!res.ok) throw new Error('Export failed.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deni-sawa-${kind === 'pdf' ? 'report.pdf' : 'report.docx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Export failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleGenerateDetailed = async () => {
    if (!report) return;
    setGeneratingDetailed(true);
    try {
      const res = await fetch(`/api/health-check/${report.session_id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_type: 'detailed' }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to generate the detailed report.');
      window.location.href = body.report_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate the detailed report.');
      setGeneratingDetailed(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-red-500/20 bg-red-500/5 px-6 py-16 text-center">
        <p className="font-display text-xl font-semibold text-foreground">Report not found</p>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
        Loading your report…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Private banner */}
      <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-growth/30 bg-growth/5 px-4 py-3 text-sm text-growth">
        <Lock className="h-4 w-4 shrink-0" />
        This report is private and unique to you — do not share the link.
      </div>

      {/* Header card */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-lg border border-card-border bg-card p-6 shadow-card">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">
            {report.check_name} · {report.report_type === 'detailed' ? 'Detailed report' : 'Summary report'}
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-foreground">
            {report.check_name} — Diagnostic Report
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Prepared for {report.session_name} · {format(new Date(report.created_at), 'd MMMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareMenu title={`${report.check_name} — Diagnostic Report`} />
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={downloading !== null}
            className="inline-flex items-center gap-1.5 rounded-btn border border-card-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-colors hover:border-brand/40 hover:text-brand disabled:opacity-50"
          >
            {downloading === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            PDF
          </button>
          <button
            type="button"
            onClick={() => handleExport('word')}
            disabled={downloading !== null}
            className="inline-flex items-center gap-1.5 rounded-btn border border-card-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-colors hover:border-brand/40 hover:text-brand disabled:opacity-50"
          >
            {downloading === 'word' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Word
          </button>
        </div>
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">{error}</div>}

      {/* Report body */}
      <div className={cn('rounded-lg border border-card-border bg-card p-6 shadow-card sm:p-8')}>
        <LexicalRenderer state={report.lexical_state} />
      </div>

      {/* Upgrade to detailed */}
      {report.report_type === 'summary' && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-brand/25 bg-brand/5 px-6 py-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div>
              <p className="font-semibold text-foreground">Want the full diagnostic?</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                The detailed report adds prioritised recommendations, deeper analysis and next steps.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateDetailed}
            disabled={generatingDetailed}
            className="inline-flex items-center gap-2 rounded-btn bg-brand px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {generatingDetailed && <Loader2 className="h-4 w-4 animate-spin" />}
            Generate detailed report
          </button>
        </div>
      )}
    </div>
  );
}

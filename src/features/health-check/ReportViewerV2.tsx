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
  header_lexical: Record<string, unknown> | null;
  footer_lexical: Record<string, unknown> | null;
  is_paid: boolean;
  delivery_status: string;
  model_used: string | null;
  generation_error: string | null;
  created_at: string;
  session_name: string;
  check_name: string;
  session_whatsapp: string | null;
  report_selection: string;
  payment_status: string;
  payment_amount: number;
  detailed_price: number;
  detailed_call_price: number;
}

type UpgradeState = 'idle' | 'phone' | 'initiating' | 'stk' | 'polling' | 'paid' | 'error';

export function ReportViewerV2({ token }: { token: string }) {
  const [report, setReport] = React.useState<ReportData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [downloading, setDownloading] = React.useState<'pdf' | 'word' | null>(null);
  const [upgradePlan, setUpgradePlan] = React.useState<'detailed' | 'detailed_call' | null>(null);
  const [upgradePhone, setUpgradePhone] = React.useState('');
  const [upgradeState, setUpgradeState] = React.useState<UpgradeState>('idle');
  const [upgradeAmount, setUpgradeAmount] = React.useState(0);
  const [upgradeError, setUpgradeError] = React.useState<string | null>(null);
  const [paidReportUrl, setPaidReportUrl] = React.useState<string | null>(null);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

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

  React.useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

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

  const chooseUpgrade = (plan: 'detailed' | 'detailed_call') => {
    setUpgradeError(null);
    setUpgradePlan(plan);
    const needsPhone = plan === 'detailed_call' && !report?.session_whatsapp;
    setUpgradeState(needsPhone ? 'phone' : 'initiating');
    if (!needsPhone) void startUpgrade(plan);
  };

  const startUpgrade = async (plan: 'detailed' | 'detailed_call') => {
    if (!report) return;
    setUpgradeState('initiating');
    setUpgradeError(null);
    const phone = plan === 'detailed_call' ? (upgradePhone || report.session_whatsapp || '') : report.session_whatsapp || '';
    try {
      const upRes = await fetch('/api/payments/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: report.session_id, plan, phone: phone || undefined }),
      });
      const upBody = await upRes.json().catch(() => ({}));
      if (!upRes.ok) {
        if (upBody.error === 'Whatsapp_required') {
          setUpgradeState('phone');
          setUpgradeError('Please enter your WhatsApp number so we can schedule your advisory call.');
          return;
        }
        throw new Error(upBody.error ?? 'Could not set up the upgrade.');
      }
      setUpgradeAmount(Number(upBody.amount ?? 0));

      // Initiate the M-Pesa STK push.
      const stkRes = await fetch('/api/payments/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: report.session_id, phone: phone || undefined }),
      });
      const stkBody = await stkRes.json().catch(() => ({}));
      if (!stkRes.ok) throw new Error(stkBody.error ?? 'Payment request failed.');
      setUpgradeState(stkBody.simulate ? 'stk' : 'polling');
      if (!stkBody.simulate) startPolling();
    } catch (e) {
      setUpgradeState('error');
      setUpgradeError(e instanceof Error ? e.message : 'Payment setup failed.');
    }
  };

  const startPolling = () => {
    if (!report) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/payments/mpesa/status?session_id=${report.session_id}`).catch(() => null);
      const body = await res?.json().catch(() => ({}));
      if (body?.payment_status === 'paid') {
        if (pollRef.current) clearInterval(pollRef.current);
        void completePaid();
      }
    }, 3000);
  };

  const confirmPaid = async () => {
    if (!report) return;
    setUpgradeState('polling');
    const res = await fetch('/api/payments/mpesa/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: report.session_id }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? 'Payment confirmation failed.');
    setPaidReportUrl(body.report_url ?? null);
    setUpgradeState('paid');
  };

  const completePaid = async () => {
    try {
      const res = await fetch('/api/payments/mpesa/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: report!.session_id }),
      });
      const body = await res.json().catch(() => ({}));
      setPaidReportUrl(body.report_url ?? null);
      setUpgradeState('paid');
    } catch {
      setUpgradeState('error');
      setUpgradeError('Payment confirmed but we could not load your report. Check your email/WhatsApp shortly.');
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

      {report.generation_error && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-700">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">AI report generation was unavailable</p>
            <p className="mt-0.5 text-xs text-amber-700/80">
              This is a summary of your answers. Our team has been notified and can provide your full diagnostic report on request.
            </p>
          </div>
        </div>
      )}

      {/* Report body */}
      <div className="report-doc rounded-lg border border-card-border bg-card p-6 shadow-card sm:p-8">
        {report.header_lexical && (
          <div className="mb-6 border-b border-card-border pb-6">
            <LexicalRenderer state={report.header_lexical} />
          </div>
        )}
        <LexicalRenderer state={report.lexical_state} />
        {report.footer_lexical && (
          <div className="mt-6 border-t border-card-border pt-6">
            <LexicalRenderer state={report.footer_lexical} />
          </div>
        )}
      </div>

      {/* Upgrade to a paid detailed report */}
      {report.report_type === 'summary' && report.payment_status !== 'paid' && (
        <div className="mt-6 rounded-lg border border-brand/25 bg-brand/5 px-6 py-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div>
              <p className="font-semibold text-foreground">Unlock the full diagnostic</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                The detailed report adds prioritised recommendations, deeper analysis and a personalised roadmap.
              </p>
            </div>
          </div>

          {upgradeState === 'idle' && (
            <div className="mt-4 flex flex-wrap gap-3">
              {report.detailed_price > 0 && (
                <button
                  type="button"
                  onClick={() => chooseUpgrade('detailed')}
                  className="inline-flex items-center gap-2 rounded-btn bg-brand px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600"
                >
                  Detailed report · KES {report.detailed_price.toLocaleString()}
                </button>
              )}
              {report.detailed_call_price > 0 && (
                <button
                  type="button"
                  onClick={() => chooseUpgrade('detailed_call')}
                  className="inline-flex items-center gap-2 rounded-btn border border-brand/40 bg-white px-5 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand/10"
                >
                  Detailed + Advisory Call · KES {report.detailed_call_price.toLocaleString()}
                </button>
              )}
            </div>
          )}

          {upgradeState === 'phone' && (
            <div className="mt-4 max-w-sm space-y-2">
              <p className="text-sm text-foreground">Enter your WhatsApp number so we can schedule your advisory call:</p>
              <input
                type="tel"
                value={upgradePhone}
                onChange={(e) => setUpgradePhone(e.target.value)}
                placeholder="+254 700 000 000"
                className="w-full rounded-btn border border-card-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
              />
              {upgradeError && <p className="text-xs font-medium text-red-600">{upgradeError}</p>}
              <button
                type="button"
                onClick={() => void startUpgrade('detailed_call')}
                className="rounded-btn bg-brand px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600"
              >
                Continue to payment
              </button>
            </div>
          )}

          {upgradeState === 'initiating' && (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-brand" /> Setting up payment…
            </p>
          )}

          {upgradeState === 'stk' && (
            <div className="mt-4 max-w-md space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-brand" /> Payment request of KES {upgradeAmount.toLocaleString()} sent.
              </p>
              <p className="text-sm text-muted-foreground">
                Approve the M-Pesa prompt on your phone. This is a sandbox/simulated payment — use the button below to complete it in the test environment.
              </p>
              <button
                type="button"
                onClick={() => void confirmPaid()}
                className="rounded-btn bg-growth px-5 py-2.5 text-sm font-bold text-white transition-colors hover:brightness-110"
              >
                I've paid — confirm payment
              </button>
              {upgradeError && <p className="text-xs font-medium text-red-600">{upgradeError}</p>}
            </div>
          )}

          {upgradeState === 'polling' && (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-brand" /> Waiting for payment confirmation…
            </p>
          )}

          {upgradeState === 'error' && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-red-600">{upgradeError}</p>
              {upgradePlan && (
                <button
                  type="button"
                  onClick={() => void startUpgrade(upgradePlan)}
                  className="rounded-btn border border-card-border px-4 py-2 text-sm font-semibold text-foreground hover:border-brand/40 hover:text-brand"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {upgradeState === 'paid' && (
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <p className="text-sm font-semibold text-growth">Payment confirmed — your detailed report is ready.</p>
              {paidReportUrl ? (
                <a href={paidReportUrl} className="rounded-btn bg-growth px-5 py-2.5 text-sm font-bold text-white transition-colors hover:brightness-110">
                  View detailed report →
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">It's on its way to your email/WhatsApp.</p>
              )}
              {upgradePlan === 'detailed_call' && (
                <p className="text-xs text-muted-foreground">An advisor will contact you shortly to schedule your call.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

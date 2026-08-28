'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { FileDown, FileText, Loader2, Lock, Phone, Sparkles } from 'lucide-react';
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
  expires_at: string | null;
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
  const [expired, setExpired] = React.useState<{ message: string; expires_at: string } | null>(null);
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
        if (!res.ok) {
          if (body.error === 'expired' && !cancelled) {
            setExpired({ message: body.message ?? 'This report has expired.', expires_at: body.expires_at });
            return;
          }
          throw new Error(body.error ?? 'Report not found.');
        }
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

  if (expired) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-amber-500/25 bg-amber-500/5 px-6 py-16 text-center">
        <Lock className="mx-auto mb-4 h-10 w-10 text-amber-600" />
        <p className="font-display text-xl font-semibold text-foreground">Report expired</p>
        <p className="mt-2 text-sm text-muted-foreground">{expired.message}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Expired on {format(new Date(expired.expires_at), 'd MMMM yyyy')}
        </p>
        <a
          href="#upgrade"
          className="mt-6 inline-flex items-center gap-2 rounded-btn bg-brand px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600"
        >
          <Sparkles className="h-4 w-4" />
          Upgrade to Full Report
        </a>
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
          {report.expires_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              Valid until {format(new Date(report.expires_at), 'd MMMM yyyy')}
              {report.report_type === 'summary' && ' · Upgrade to keep your report for 12 months'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ShareMenu title={`${report.check_name} — Diagnostic Report`} />
          {report.report_type === 'detailed' ? (
            <>
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
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-btn border border-card-border bg-background px-3.5 py-2 text-[13px] font-medium text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              PDF &amp; Word available in Full Report
            </span>
          )}
        </div>
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">{error}</div>}

      {report.generation_error && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-700">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Report generation was unavailable</p>
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

      {/* Upgrade to a paid detailed report — summary only */}
      {report.report_type === 'summary' && report.payment_status !== 'paid' && (
        <div className="mt-8 overflow-hidden rounded-xl border border-brand/25 bg-gradient-to-br from-brand/5 via-background to-growth/5">
          <div className="border-b border-brand/10 bg-brand/5 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-brand" />
              <p className="font-display text-lg font-semibold text-foreground">Unlock the Full Diagnostic</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;re viewing a <span className="font-semibold">summary report</span> — a snapshot of your top priorities.
              Upgrade to get the complete picture.
            </p>
          </div>

          <div className="px-6 py-5">
            {/* What's included */}
            <div className="mb-5 rounded-lg border border-card-border bg-card p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand">What the Full Report includes</p>
              <ul className="mt-2.5 space-y-1.5 text-sm text-foreground">
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> Category-by-category findings with detailed analysis</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> What each finding means for your business</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> Prioritised recommendation list</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> Step-by-step action plan</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> Advisor commentary</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> PDF &amp; Word export — valid for 12 months</li>
              </ul>
            </div>

            {/* How it works */}
            <div className="mb-5 rounded-lg border border-card-border bg-card p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand">How it works</p>
              <div className="mt-2.5 flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand">1</span>
                  <p className="text-sm text-foreground">Choose your plan below and enter your M-Pesa number</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand">2</span>
                  <p className="text-sm text-foreground">You&apos;ll receive an M-Pesa prompt on your phone — enter your PIN to pay</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand">3</span>
                  <p className="text-sm text-foreground">Your full report is generated instantly and delivered to your email/WhatsApp</p>
                </div>
              </div>
            </div>

            {/* Upgrade options */}
            {upgradeState === 'idle' && (
              <div className="grid gap-3 sm:grid-cols-2">
                {report.detailed_price > 0 && (
                  <button
                    type="button"
                    onClick={() => chooseUpgrade('detailed')}
                    className="group rounded-xl border-2 border-brand/20 bg-card p-5 text-left transition-all hover:border-brand hover:shadow-md"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-widest text-brand">Full Report</p>
                    <p className="mt-2 font-display text-2xl font-bold text-foreground">
                      KES {report.detailed_price.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">One-time payment · Report delivered instantly</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand group-hover:underline">
                      Get Full Report →
                    </span>
                  </button>
                )}
                {report.detailed_call_price > 0 && (
                  <button
                    type="button"
                    onClick={() => chooseUpgrade('detailed_call')}
                    className="group rounded-xl border-2 border-growth/25 bg-card p-5 text-left transition-all hover:border-growth hover:shadow-md"
                  >
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-growth" />
                      <p className="text-[11px] font-bold uppercase tracking-widest text-growth">Full Report + Advisory Call</p>
                    </div>
                    <p className="mt-2 font-display text-2xl font-bold text-foreground">
                      KES {report.detailed_call_price.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Full report + 30-min call with a financial advisor
                    </p>
                    {report.detailed_price > 0 && (
                      <p className="mt-1 text-[11px] font-medium text-growth">
                        + KES {(report.detailed_call_price - report.detailed_price).toLocaleString()} for the advisory call
                      </p>
                    )}
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-growth group-hover:underline">
                      Get Report + Call →
                    </span>
                  </button>
                )}
              </div>
            )}

            {upgradeState === 'phone' && (
              <div className="max-w-sm space-y-2">
                <p className="text-sm font-semibold text-foreground">Enter your WhatsApp number for the advisory call:</p>
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
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-brand" /> Preparing your detailed report… this can take a minute.
              </p>
            )}

            {upgradeState === 'stk' && (
              <div className="max-w-md space-y-3">
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
                  I&apos;ve paid — confirm payment
                </button>
                {upgradeError && <p className="text-xs font-medium text-red-600">{upgradeError}</p>}
              </div>
            )}

            {upgradeState === 'polling' && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-brand" /> Waiting for payment confirmation…
              </p>
            )}

            {upgradeState === 'error' && (
              <div className="space-y-2">
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
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-sm font-semibold text-growth">Payment confirmed — your detailed report is ready.</p>
                {paidReportUrl ? (
                  <a href={paidReportUrl} className="rounded-btn bg-growth px-5 py-2.5 text-sm font-bold text-white transition-colors hover:brightness-110">
                    View detailed report →
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">It&apos;s on its way to your email/WhatsApp.</p>
                )}
                {upgradePlan === 'detailed_call' && (
                  <p className="text-xs text-muted-foreground">An advisor will contact you shortly to schedule your call.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Advisory call upsell — detailed report only */}
      {report.report_type === 'detailed' && report.payment_status === 'paid' && report.detailed_call_price > report.detailed_price && !report.session_whatsapp && (
        <div className="mt-8 rounded-xl border border-growth/25 bg-growth/5 px-6 py-5">
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-growth" />
            <div>
              <p className="font-semibold text-foreground">Want to discuss this with an advisor?</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Book a 30-minute advisory call to walk through your report, ask questions, and get personalised guidance.
              </p>
              <p className="mt-1 text-[11px] font-medium text-growth">
                + KES {(report.detailed_call_price - report.detailed_price).toLocaleString()} for the advisory call
              </p>
              <a
                href="#contact"
                className="mt-3 inline-flex items-center gap-1.5 rounded-btn bg-growth px-4 py-2 text-sm font-bold text-white transition-colors hover:brightness-110"
              >
                <Phone className="h-3.5 w-3.5" /> Book an advisory call
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

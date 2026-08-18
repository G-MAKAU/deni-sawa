'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Clock, Loader2, Lock, Mail, MessageCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Option {
  id: string;
  option_text: string;
  sort_order: number;
}

interface Question {
  id: string;
  question_text: string;
  question_type: 'paragraph' | 'single_select' | 'multi_select';
  is_required: boolean;
  helper_text: string | null;
  sort_order: number;
  options: Option[];
}

interface SectionGroup {
  title: string;
  description: string | null;
  questions: Question[];
}

interface CheckInfo {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  estimated_minutes: number | null;
  tags: string[];
  detailed_price: number | null;
  detailed_call_price: number | null;
}

type Answer = string | string[];

type Phase = 'loading' | 'details' | 'questions' | 'submitting' | 'generating' | 'payment' | 'done' | 'error';

type ReportSelection = 'summary' | 'detailed' | 'detailed_call';

const INPUT_CLASS =
  'h-12 w-full rounded-lg border border-card-border bg-background px-4 text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

function isAnswered(question: Question, answers: Record<string, Answer>): boolean {
  const value = answers[question.id];
  if (question.question_type === 'paragraph') return typeof value === 'string' && value.trim().length > 0;
  if (question.question_type === 'single_select') return typeof value === 'string' && value.length > 0;
  return Array.isArray(value) && value.length > 0;
}

function QuestionField({
  question,
  questionNumber,
  value,
  onChange,
}: {
  question: Question;
  questionNumber: number;
  value: Answer | undefined;
  onChange: (value: Answer) => void;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-5 sm:p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">QN {questionNumber}.</p>
      <h3 className="mt-1 text-[17px] font-semibold leading-snug text-foreground">
        {question.question_text}
        {question.is_required && <span className="text-brand"> *</span>}
      </h3>
      {question.helper_text && <p className="mt-1.5 text-[13px] text-muted-foreground">{question.helper_text}</p>}

      <div className="mt-5">
        {question.question_type === 'paragraph' && (
          <textarea
            rows={4}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer…"
            className="w-full rounded-lg border border-card-border bg-background px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        )}

        {question.question_type === 'single_select' && (
          <div className="grid gap-2.5">
            {question.options.map((option) => {
              const selected = value === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange(option.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-5 py-3.5 text-left text-[15px] font-medium transition-colors',
                    selected ? 'border-brand bg-brand/5 text-brand' : 'border-card-border text-foreground hover:border-brand/30'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                      selected ? 'border-brand bg-brand' : 'border-muted-foreground/40'
                    )}
                  >
                    {selected && <Check className="h-3 w-3 text-white" />}
                  </span>
                  {option.option_text}
                </button>
              );
            })}
          </div>
        )}

        {question.question_type === 'multi_select' && (
          <div className="grid gap-2.5">
            {question.options.map((option) => {
              const current = Array.isArray(value) ? value : [];
              const selected = current.includes(option.id);
              const toggle = () =>
                onChange(selected ? current.filter((id) => id !== option.id) : [...current, option.id]);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={toggle}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-5 py-3.5 text-left text-[15px] font-medium transition-colors',
                    selected ? 'border-growth bg-growth/5 text-growth' : 'border-card-border text-foreground hover:border-growth/40'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                      selected ? 'border-growth bg-growth' : 'border-muted-foreground/40'
                    )}
                  >
                    {selected && <Check className="h-3 w-3 text-white" />}
                  </span>
                  {option.option_text}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function HealthCheckWizardV2({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeSessionId = searchParams.get('session');

  const [phase, setPhase] = React.useState<Phase>('loading');
  const [check, setCheck] = React.useState<CheckInfo | null>(null);
  const [sections, setSections] = React.useState<SectionGroup[]>([]);
  const [questionCount, setQuestionCount] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [isResuming, setIsResuming] = React.useState(false);

  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [sectionIndex, setSectionIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, Answer>>({});

  // Details
  const [fullName, setFullName] = React.useState('');
  const [businessName, setBusinessName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [preferredDelivery, setPreferredDelivery] = React.useState<'email' | 'whatsapp' | 'both'>('email');
  const [reportSelection, setReportSelection] = React.useState<ReportSelection>('summary');

  // Payment state for paid reports.
  const [paymentAmount, setPaymentAmount] = React.useState(0);
  const [paymentPhone, setPaymentPhone] = React.useState('');
  const [paymentState, setPaymentState] = React.useState<'idle' | 'init' | 'pending' | 'paid' | 'error'>('idle');
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  const [pendingReportUrl, setPendingReportUrl] = React.useState<string | null>(null);
  const paymentPollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    return () => {
      if (paymentPollRef.current) clearInterval(paymentPollRef.current);
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/health-check/${slug}/questions`, { cache: 'no-store' });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? 'Failed to load the assessment.');

        // Group questions by section — all questions in a section are shown together.
        const grouped: SectionGroup[] = (body.sections as Array<{
          title: string;
          description: string | null;
          subsections: { questions: Question[] }[];
        }>).map((section) => ({
          title: section.title,
          description: section.description,
          questions: section.subsections.flatMap((sub) => sub.questions),
        }));

        if (cancelled) return;
        setCheck(body.check as CheckInfo);
        setSections(grouped);
        setQuestionCount(grouped.reduce((n, s) => n + s.questions.length, 0));

        // Resume support — if the user returned via the emailed/WhatsApp resume link,
        // restore their saved answers, details and position in the flow.
        if (resumeSessionId) {
          setIsResuming(true);
          try {
            const r = await fetch(`/api/health-check/${resumeSessionId}/answers`, { cache: 'no-store' });
            const rb = await r.json();
            if (!r.ok) throw new Error(rb.error ?? 'Failed to load your saved progress.');
            if (rb.session?.is_complete) {
              router.replace(`/health-checks/report/${resumeSessionId}`);
              return;
            }
            setSessionId(resumeSessionId);
            if (rb.session) {
              setFullName(rb.session.full_name ?? '');
              setBusinessName(rb.session.business_name ?? '');
              setEmail(rb.session.email ?? '');
              setWhatsapp(rb.session.whatsapp ?? '');
              if (rb.session.preferred_delivery) setPreferredDelivery(rb.session.preferred_delivery);
              if (rb.session.report_selection) setReportSelection(rb.session.report_selection);
            }
            const saved = (rb.answers ?? {}) as Record<string, Answer>;
            setAnswers(saved);

            // Jump to the first section with unanswered questions.
            let firstIncomplete = 0;
            for (let i = 0; i < grouped.length; i += 1) {
              if (grouped[i].questions.some((q) => !isAnswered(q, saved))) {
                firstIncomplete = i;
                break;
              }
            }
            setSectionIndex(firstIncomplete);
            setPhase('questions');
            setIsResuming(false);
            return;
          } catch (e) {
            setError(e instanceof Error ? e.message : 'We could not restore your saved progress. You can start fresh below.');
            setIsResuming(false);
          }
        }

        setPhase('details');
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load the assessment.');
          setPhase('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, resumeSessionId]);

  const currentSection = sections[sectionIndex];
  const totalSections = sections.length;

  const questionNumbers = React.useMemo(() => {
    const map: Record<string, number> = {};
    let n = 1;
    for (const section of sections) {
      for (const q of section.questions) {
        map[q.id] = n;
        n += 1;
      }
    }
    return map;
  }, [sections]);

  const handleStart = async () => {
    setError(null);
    if (!fullName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (slug === 'business-health-check' && !businessName.trim()) {
      setError('Please enter your business name.');
      return;
    }
    if (!email.trim() && !whatsapp.trim()) {
      setError('Provide at least an email or WhatsApp number so we can send your report.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (whatsapp.trim() && !/^\+?[0-9\s-]{8,}$/.test(whatsapp.trim())) {
      setError('Please enter a valid WhatsApp number (e.g. +254700000000).');
      return;
    }
    if (reportSelection === 'detailed_call' && !whatsapp.trim()) {
      setError('A WhatsApp number is required for the Detailed + Advisory Call option so we can schedule your call.');
      return;
    }

    setPhase('submitting');
    try {
      const res = await fetch('/api/health-check/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          health_check_id: check!.id,
          full_name: fullName.trim(),
          business_name: businessName.trim() || undefined,
          email: email.trim(),
          whatsapp: whatsapp.trim(),
          preferred_delivery: preferredDelivery,
          report_selection: reportSelection,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error === 'rate_limit_exceeded' ? 'You have reached the monthly limit for this assessment. Please try again next month.' : (body.error ?? 'Failed to start the assessment.'));
      }
      setSessionId(body.session_id);
      setSectionIndex(0);
      setPhase('questions');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start the assessment.');
      setPhase('details');
    }
  };

  const setAnswer = (questionId: string, value: Answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Autosave the answers answered so far so a user can resume from the emailed link.
  const saveProgress = async () => {
    if (!sessionId) return;
    const allQuestions = sections.flatMap((s) => s.questions);
    const payload = allQuestions
      .filter((q) => isAnswered(q, answers))
      .map((question) => {
        const raw = answers[question.id];
        if (question.question_type === 'paragraph') {
          return { question_id: question.id, answer_text: typeof raw === 'string' ? raw : '', selected_option_ids: [] };
        }
        if (question.question_type === 'single_select') {
          return { question_id: question.id, answer_text: null, selected_option_ids: [raw as string] };
        }
        return { question_id: question.id, answer_text: null, selected_option_ids: (raw as string[]) ?? [] };
      });
    if (payload.length === 0) return;
    try {
      await fetch(`/api/health-check/${sessionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload, is_partial: true }),
      });
    } catch {
      // Best-effort — never block navigation on a failed autosave.
    }
  };

  const missingInSection = (section: SectionGroup): string[] => {
    if (!section) return [];
    return section.questions.filter((q) => q.is_required && !isAnswered(q, answers)).map((q) => q.question_text);
  };

  const handleNextSection = () => {
    if (!currentSection) return;
    const missing = missingInSection(currentSection);
    if (missing.length > 0) {
      setError(`Please answer the required questions before continuing.`);
      return;
    }
    setError(null);
    if (sectionIndex < totalSections - 1) {
      void saveProgress();
      setSectionIndex((s) => s + 1);
    } else {
      void submitAnswers();
    }
  };

  const handlePreviousSection = () => {
    if (sectionIndex === 0) return;
    void saveProgress();
    setSectionIndex((s) => Math.max(0, s - 1));
  };

  const submitAnswers = async () => {
    if (!sessionId) return;
    setPhase('submitting');
    try {
      const allQuestions = sections.flatMap((s) => s.questions);
      const payload = allQuestions.map((question) => {
        const raw = answers[question.id];
        if (question.question_type === 'paragraph') {
          return { question_id: question.id, answer_text: typeof raw === 'string' ? raw : '', selected_option_ids: [] };
        }
        if (question.question_type === 'single_select') {
          return { question_id: question.id, answer_text: null, selected_option_ids: [raw as string] };
        }
        return { question_id: question.id, answer_text: null, selected_option_ids: (raw as string[]) ?? [] };
      });

      const res = await fetch(`/api/health-check/${sessionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to submit your answers.');

      await generateReport();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit your answers.');
      setPhase('questions');
    }
  };

  const generateReport = async () => {
    if (!sessionId) return;
    setPhase('generating');
    try {
      const res = await fetch(`/api/health-check/${sessionId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_type: reportSelection === 'summary' ? 'summary' : 'detailed' }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Report generation failed.');
      if (body.requires_payment) {
        setPaymentAmount(Number(body.payment_amount ?? 0));
        setPendingReportUrl(body.report_url ?? null);
        setPaymentPhone(whatsapp.trim());
        setPaymentState('idle');
        setPhase('payment');
        return;
      }
      setPhase('done');
      router.push(body.report_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Report generation failed. Please try again.');
      setPhase('questions');
    }
  };

  const startPayment = async () => {
    if (!sessionId) return;
    setPaymentState('init');
    setPaymentError(null);
    const phone = (paymentPhone || whatsapp).trim();
    try {
      const res = await fetch('/api/payments/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, phone: phone || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? 'Payment request failed.');
      setPaymentState(body.simulate ? 'pending' : 'pending');
      if (!body.simulate) {
        if (paymentPollRef.current) clearInterval(paymentPollRef.current);
        paymentPollRef.current = setInterval(async () => {
          const st = await fetch(`/api/payments/mpesa/status?session_id=${sessionId}`).catch(() => null);
          const sb = await st?.json().catch(() => ({}));
          if (sb?.payment_status === 'paid') {
            if (paymentPollRef.current) clearInterval(paymentPollRef.current);
            void finishPaid();
          }
        }, 3000);
      }
    } catch (e) {
      setPaymentState('error');
      setPaymentError(e instanceof Error ? e.message : 'Payment request failed.');
    }
  };

  const confirmPayment = async () => {
    if (!sessionId) return;
    setPaymentState('pending');
    setPaymentError(null);
    try {
      const res = await fetch('/api/payments/mpesa/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? 'Payment confirmation failed.');
      setPaymentState('paid');
    } catch (e) {
      setPaymentState('error');
      setPaymentError(e instanceof Error ? e.message : 'Payment confirmation failed.');
    }
  };

  const finishPaid = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch('/api/payments/mpesa/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const body = await res.json().catch(() => ({}));
      setPaymentState('paid');
      if (body.report_url) setPendingReportUrl(body.report_url);
    } catch {
      setPaymentState('error');
      setPaymentError('Payment confirmed, but we could not load your report. Check your email/WhatsApp shortly.');
    }
  };

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm text-muted-foreground">{isResuming ? 'Restoring your saved progress…' : 'Preparing your assessment…'}</p>
      </div>
    );
  }

  /* ── Error (loading) ──────────────────────────────────────────────────── */
  if (phase === 'error' && !check) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-6 py-12 text-center">
        <p className="font-semibold text-foreground">We couldn't load this assessment</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  /* ── Details ──────────────────────────────────────────────────────────── */
  if (phase === 'details') {
    return (
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">
              Step 1 of {totalSections + 1}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">Tell us about yourself</span>
          </div>
          <div className="mt-2 h-[3px] w-full bg-bgalt">
            <div className="h-[3px] bg-brand transition-all duration-300" style={{ width: `${(1 / (totalSections + 1)) * 100}%` }} />
          </div>
          <h2 className="mt-6 font-display text-2xl font-semibold text-foreground">{check?.name}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {totalSections} sections · {questionCount} questions · about {check?.estimated_minutes ?? 15} minutes.
            Tell us where to send your private report.
          </p>
        </div>

        {error && <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">{error}</div>}

        <div className="rounded-lg border border-card-border bg-card p-6 shadow-card sm:p-8">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
                Full name <span className="text-brand">*</span>
              </label>
              <input className={INPUT_CLASS} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Jane Wanjiku" />
            </div>

            {slug === 'business-health-check' && (
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
                  Business name <span className="text-brand">*</span>
                </label>
                <input className={INPUT_CLASS} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Bright Ltd" />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-foreground">Email</label>
              <input className={INPUT_CLASS} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-foreground">WhatsApp number</label>
              <input className={INPUT_CLASS} type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+254 700 000 000" />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-foreground">Report type</label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setReportSelection('summary')}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                    reportSelection === 'summary' ? 'border-brand bg-brand/5' : 'border-card-border hover:border-brand/30'
                  )}
                >
                  <span>
                    <span className="font-semibold text-foreground">Free Summary</span>
                    <span className="block text-xs text-muted-foreground">Your summary diagnostic report — free.</span>
                  </span>
                  <span className="font-semibold text-growth">KES 0</span>
                </button>
                {check?.detailed_price != null && check.detailed_price > 0 && (
                  <button
                    type="button"
                    onClick={() => setReportSelection('detailed')}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                      reportSelection === 'detailed' ? 'border-brand bg-brand/5' : 'border-card-border hover:border-brand/30'
                    )}
                  >
                    <span>
                      <span className="font-semibold text-foreground">Full Detailed Report</span>
                      <span className="block text-xs text-muted-foreground">Prioritised recommendations and a deeper analysis.</span>
                    </span>
                    <span className="font-semibold text-brand">KES {check.detailed_price.toLocaleString()}</span>
                  </button>
                )}
                {check?.detailed_call_price != null && check.detailed_call_price > 0 && (
                  <button
                    type="button"
                    onClick={() => setReportSelection('detailed_call')}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                      reportSelection === 'detailed_call' ? 'border-brand bg-brand/5' : 'border-card-border hover:border-brand/30'
                    )}
                  >
                    <span>
                      <span className="font-semibold text-foreground">Detailed + Advisory Call</span>
                      <span className="block text-xs text-muted-foreground">
                        Full detailed report plus a call with our advisory team. WhatsApp number required.
                      </span>
                    </span>
                    <span className="font-semibold text-brand">KES {check.detailed_call_price.toLocaleString()}</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-foreground">Preferred report delivery</label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: 'email', label: 'Email', icon: Mail, disabled: !email.trim() },
                    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, disabled: !whatsapp.trim() },
                    { value: 'both', label: 'Both', icon: Sparkles, disabled: !email.trim() || !whatsapp.trim() },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => setPreferredDelivery(option.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-[13px] font-semibold transition-colors',
                      preferredDelivery === option.value
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-card-border text-muted-foreground hover:border-brand/30',
                      option.disabled && 'cursor-not-allowed opacity-40'
                    )}
                  >
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {email.trim() && !whatsapp.trim() && 'WhatsApp delivery unlocks once you add a number.'}
              </p>
            </div>
          </div>

          <Button className="mt-7 w-full" size="lg" onClick={handleStart}>
            Begin Assessment
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-brand" />
            Your responses and report are private and never shared.
          </p>
        </div>
      </div>
    );
  }

  /* ── Questions (section by section) ───────────────────────────────────── */
  if (phase === 'questions' && currentSection) {
    const sectionProgress = ((sectionIndex + 1) / totalSections) * 100;
    const answeredHere = currentSection.questions.filter((q) => isAnswered(q, answers)).length;
    const missing = missingInSection(currentSection);

    return (
      <>
        {/* Floating section header — full-width bar, sticks to the top while scrolling
            down and lets the main navbar return on scroll up (same pattern as the
            Business Support quick-nav). */}
        <section className="sticky top-0 z-30 w-[100vw] border-b border-card-border bg-background/95 backdrop-blur-md mx-[calc(50%-50vw)]">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-5 py-3.5">
            <p className="min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.2em] text-brand">
              Section {sectionIndex + 1} of {totalSections} ·{' '}
              <span className="normal-case tracking-normal text-muted-foreground">{currentSection.title}</span>
            </p>
            <p className="shrink-0 font-mono text-xs text-muted-foreground">
              {answeredHere} / {currentSection.questions.length} answered
            </p>
          </div>
          <div className="h-[3px] w-full bg-bgalt">
            <div className="h-[3px] bg-brand transition-all duration-300" style={{ width: `${sectionProgress}%` }} />
          </div>
        </section>

        <div className="mx-auto mt-8 max-w-2xl space-y-6">
          {resumeSessionId && (
            <div className="flex items-center gap-2 rounded-lg border border-growth/30 bg-growth/5 px-4 py-3 text-sm text-foreground">
              <Check className="h-4 w-4 shrink-0 text-growth" />
              Progress restored — continuing where you left off. Changes are saved automatically.
            </div>
          )}

          {currentSection.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{currentSection.description}</p>
          )}

          {currentSection.questions.map((question) => (
            <QuestionField
              key={question.id}
              question={question}
              questionNumber={questionNumbers[question.id]}
              value={answers[question.id]}
              onChange={(value) => setAnswer(question.id, value)}
            />
          ))}
        </div>

        {error && (
          <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="mx-auto mt-8 flex max-w-2xl items-center justify-between">
          <Button variant="ghostLight" onClick={handlePreviousSection} disabled={sectionIndex === 0}>
            <ArrowLeft className="h-4 w-4" /> Previous section
          </Button>
          <div className="flex items-center gap-2">
            {missing.length > 0 && (
              <span className="text-xs text-muted-foreground">Complete required questions to continue</span>
            )}
            <Button onClick={handleNextSection}>
              {sectionIndex === totalSections - 1 ? 'Generate My Report' : 'Next section'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </>
    );
  }

  /* ── Payment (paid reports) ─────────────────────────────────────────────── */
  if (phase === 'payment') {
    const isCall = reportSelection === 'detailed_call';
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-lg border border-card-border bg-card p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-semibold text-foreground">Complete payment to unlock your report</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your detailed report will be generated once payment is confirmed and sent to you{isCall ? ' — an advisor will then call you shortly' : ''}.
          </p>

          <div className="mt-5 flex items-center justify-between rounded-lg border border-card-border bg-bgalt px-4 py-3">
            <span className="text-sm text-foreground">Amount due</span>
            <span className="font-display text-lg font-bold text-brand">KES {paymentAmount.toLocaleString()}</span>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-[13px] font-semibold text-foreground">M-Pesa phone number</label>
            <input
              className={INPUT_CLASS}
              type="tel"
              value={paymentPhone}
              onChange={(e) => setPaymentPhone(e.target.value)}
              placeholder="+254 700 000 000"
              disabled={paymentState === 'pending'}
            />
            <p className="mt-1 text-xs text-muted-foreground">You'll receive an STK push prompt to approve the payment.</p>
          </div>

          {paymentError && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">{paymentError}</div>
          )}

          {paymentState === 'paid' ? (
            <div className="mt-6 rounded-lg border border-growth/30 bg-growth/5 px-4 py-4">
              <p className="font-semibold text-growth">Payment confirmed — thank you!</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isCall ? 'Your detailed report is on its way and an advisor will contact you shortly.' : 'Your detailed report is on its way.'}
              </p>
              {pendingReportUrl && (
                <Button asChild size="lg" className="mt-4 w-full">
                  <a href={pendingReportUrl}>View detailed report</a>
                </Button>
              )}
            </div>
          ) : paymentState === 'pending' ? (
            <div className="mt-6 flex flex-col items-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-brand" />
              <p className="text-sm text-muted-foreground">Waiting for payment…</p>
              <button
                type="button"
                onClick={() => void confirmPayment()}
                className="text-sm font-semibold text-brand hover:underline"
              >
                I've paid — confirm payment
              </button>
            </div>
          ) : (
            <Button
              size="lg"
              className="mt-6 w-full"
              onClick={() => void startPayment()}
              disabled={paymentState === 'init'}
            >
              {paymentState === 'init' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              {paymentState === 'init' ? 'Sending M-Pesa prompt…' : 'Pay with M-Pesa'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  /* ── Submitting / generating ──────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-brand" />
      <div>
        <p className="font-display text-xl font-semibold text-foreground">
          {phase === 'generating' ? 'Deni Sawa Partners is analysing your answers…' : 'Saving your answers…'}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {phase === 'generating'
            ? 'This typically takes about 30 seconds. We are building your personalised diagnostic report.'
            : 'Just a moment.'}
        </p>
      </div>
      {phase === 'generating' && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> Do not close this tab.
        </p>
      )}
    </div>
  );
}

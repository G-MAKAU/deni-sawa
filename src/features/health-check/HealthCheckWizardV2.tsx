'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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

interface Subsection {
  id: string;
  heading: string;
  description: string | null;
  questions: Question[];
}

interface Section {
  id: string;
  title: string;
  description: string | null;
  subsections: Subsection[];
}

interface CheckInfo {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  estimated_minutes: number | null;
  tags: string[];
}

interface FlatQuestion extends Question {
  sectionTitle: string;
  subsectionHeading: string;
}

type Answer = string | string[];

type Phase = 'loading' | 'details' | 'questions' | 'submitting' | 'generating' | 'done' | 'error';

const INPUT_CLASS =
  'h-12 w-full rounded-lg border border-card-border bg-background px-4 text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

export function HealthCheckWizardV2({ slug }: { slug: string }) {
  const router = useRouter();

  const [phase, setPhase] = React.useState<Phase>('loading');
  const [check, setCheck] = React.useState<CheckInfo | null>(null);
  const [flatQuestions, setFlatQuestions] = React.useState<FlatQuestion[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, Answer>>({});

  // Details
  const [fullName, setFullName] = React.useState('');
  const [businessName, setBusinessName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [preferredDelivery, setPreferredDelivery] = React.useState<'email' | 'whatsapp' | 'both'>('email');

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/health-check/${slug}/questions`, { cache: 'no-store' });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? 'Failed to load the assessment.');

        const flat: FlatQuestion[] = [];
        (body.sections as Section[]).forEach((section) =>
          section.subsections.forEach((subsection) =>
            subsection.questions.forEach((question) =>
              flat.push({ ...question, sectionTitle: section.title, subsectionHeading: subsection.heading })
            )
          )
        );

        if (!cancelled) {
          setCheck(body.check as CheckInfo);
          setFlatQuestions(flat);
          setPhase('details');
        }
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
  }, [slug]);

  const currentQuestion = flatQuestions[step];

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
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error === 'rate_limit_exceeded' ? 'You have reached the monthly limit for this assessment. Please try again next month.' : (body.error ?? 'Failed to start the assessment.'));
      }
      setSessionId(body.session_id);
      setStep(0);
      setPhase('questions');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start the assessment.');
      setPhase('details');
    }
  };

  const setAnswer = (questionId: string, value: Answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const isCurrentAnswered = (): boolean => {
    if (!currentQuestion) return false;
    const value = answers[currentQuestion.id];
    if (currentQuestion.question_type === 'paragraph') return typeof value === 'string' && value.trim().length > 0;
    if (currentQuestion.question_type === 'single_select') return typeof value === 'string' && value.length > 0;
    return Array.isArray(value) && value.length > 0;
  };

  const handleNext = () => {
    if (!isCurrentAnswered()) return;
    if (step < flatQuestions.length - 1) {
      setStep((s) => s + 1);
    } else {
      void submitAnswers();
    }
  };

  const submitAnswers = async () => {
    if (!sessionId) return;
    setPhase('submitting');
    try {
      const payload = flatQuestions.map((question) => {
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
        body: JSON.stringify({ report_type: 'summary' }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Report generation failed.');
      setPhase('done');
      router.push(body.report_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Report generation failed. Please try again.');
      setPhase('questions');
    }
  };

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm text-muted-foreground">Preparing your assessment…</p>
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
        <div className="mb-8 text-center">
          <span className="eyebrow">Start your assessment</span>
          <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">{check?.name}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {flatQuestions.length} questions · about {check?.estimated_minutes ?? 15} minutes. Tell us where to send your private report.
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
              <label className="mb-1.5 block text-[13px] font-semibold text-foreground">How should we deliver your report?</label>
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

  /* ── Questions ────────────────────────────────────────────────────────── */
  if (phase === 'questions' && currentQuestion) {
    const progress = (step / flatQuestions.length) * 100;
    const value = answers[currentQuestion.id];

    return (
      <div className="mx-auto max-w-2xl">
        <div className="sticky top-24 z-20 rounded-lg border border-card-border bg-card/95 shadow-card backdrop-blur-sm">
          <div className="flex items-center justify-between px-5 pt-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">
              {currentQuestion.sectionTitle} · {currentQuestion.subsectionHeading}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {step + 1} / {flatQuestions.length}
            </p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-bgalt">
            <div className="h-2 rounded-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold leading-snug text-foreground">
            {currentQuestion.question_text}
            {currentQuestion.is_required && <span className="text-brand"> *</span>}
          </h2>
          {currentQuestion.helper_text && <p className="mt-2 text-sm text-muted-foreground">{currentQuestion.helper_text}</p>}

          <div className="mt-8">
            {currentQuestion.question_type === 'paragraph' && (
              <textarea
                rows={5}
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                placeholder="Type your answer…"
                className="w-full rounded-lg border border-card-border bg-background px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            )}

            {currentQuestion.question_type === 'single_select' && (
              <div className="grid gap-2.5">
                {currentQuestion.options.map((option) => {
                  const selected = value === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setAnswer(currentQuestion.id, option.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border px-5 py-4 text-left text-[15px] font-medium transition-colors',
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

            {currentQuestion.question_type === 'multi_select' && (
              <div className="grid gap-2.5">
                {currentQuestion.options.map((option) => {
                  const selected = Array.isArray(value) && value.includes(option.id);
                  const toggle = () => {
                    const current = Array.isArray(value) ? value : [];
                    setAnswer(
                      currentQuestion.id,
                      selected ? current.filter((id) => id !== option.id) : [...current, option.id]
                    );
                  };
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={toggle}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border px-5 py-4 text-left text-[15px] font-medium transition-colors',
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

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghostLight" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={handleNext} disabled={!isCurrentAnswered()}>
              {step === flatQuestions.length - 1 ? 'Generate My Report' : 'Next'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {error && <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">{error}</div>}
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
          {phase === 'generating' ? 'Claude AI is analysing your answers…' : 'Saving your answers…'}
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

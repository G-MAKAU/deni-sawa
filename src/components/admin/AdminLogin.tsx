'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/browser';
import { AlertCircle, Loader2, Lock, ShieldCheck } from 'lucide-react';

const REASON_MESSAGES: Record<string, string> = {
  timeout: 'Your session expired due to inactivity.',
  unauthorized: 'Your account does not have admin access.',
};

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [reason, setReason] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('reason');
    if (r && REASON_MESSAGES[r]) setReason(REASON_MESSAGES[r]);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setReason(null);

    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError('Invalid email or password. Please try again.');
        return;
      }
      router.replace('/admin/dashboard');
    } catch {
      setError('Something went wrong signing you in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--a-bg)] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#E8510A] font-heading text-xl font-bold text-white shadow-[0_8px_24px_rgba(232,81,10,0.35)]">
            DS
          </div>
          <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-[var(--a-ink)]">
            DENI <span className="text-[#E8510A]">SAWA</span>
          </h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.28em] text-[var(--a-muted)]">Partners · Admin</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[var(--a-border)] bg-[var(--a-card)] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.08)]">
          <h2 className="font-heading text-lg font-bold text-[var(--a-ink)]">Sign in to your account</h2>
          <p className="mt-1 text-sm text-[var(--a-muted)]">Staff access only.</p>

          {reason && (
            <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {reason}
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@deni-sawa.com"
                className="h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#E8510A] text-sm font-bold text-white transition-colors hover:bg-[#c94508] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--a-muted)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#5A9E28]" />
          Sessions time out automatically after 10 minutes of inactivity.
        </div>
      </div>
    </div>
  );
}

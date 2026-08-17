'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, Lock, ShieldCheck } from 'lucide-react';

export function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  if (!email || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--a-bg)] px-4">
        <div className="w-full max-w-md rounded-xl border border-[var(--a-border)] bg-[var(--a-card)] p-8 text-center">
          <p className="font-semibold text-[var(--a-ink)]">Invalid or missing reset link</p>
          <p className="mt-1 text-sm text-[var(--a-muted)]">Please use the link from your password reset email.</p>
          <a href="/admin/login" className="mt-5 inline-block text-sm font-semibold text-[#E8510A] hover:underline">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'We could not reset your password. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--a-bg)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#E8510A] font-heading text-xl font-bold text-white shadow-[0_8px_24px_rgba(232,81,10,0.35)]">
            DS
          </div>
          <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-[var(--a-ink)]">
            DENI <span className="text-[#E8510A]">SAWA</span>
          </h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.28em] text-[var(--a-muted)]">Partners · Admin</p>
        </div>

        <div className="rounded-xl border border-[var(--a-border)] bg-[var(--a-card)] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.08)]">
          {done ? (
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-heading text-lg font-bold text-[var(--a-ink)]">Password updated</h2>
              <p className="mt-1 text-sm text-[var(--a-muted)]">You can now sign in with your new password.</p>
              <button
                type="button"
                onClick={() => router.replace('/admin/login')}
                className="mt-6 h-11 w-full rounded-lg bg-[#E8510A] text-sm font-bold text-white transition-colors hover:bg-[#c94508]"
              >
                Sign in
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-heading text-lg font-bold text-[var(--a-ink)]">Choose a new password</h2>
              <p className="mt-1 text-sm text-[var(--a-muted)]">
                Resetting for <span className="font-medium text-[var(--a-ink2)]">{email}</span>
              </p>

              {error && (
                <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">
                    New password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
                  />
                </div>

                <div>
                  <label htmlFor="confirm" className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">
                    Confirm new password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#E8510A] text-sm font-bold text-white transition-colors hover:bg-[#c94508] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Lock className="h-4 w-4" />
                  Reset password
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--a-muted)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#5A9E28]" />
          Reset links expire after one hour.
        </div>
      </div>
    </div>
  );
}

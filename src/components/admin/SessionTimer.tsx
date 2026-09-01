'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createBrowserClient } from '@/lib/supabase/browser';

const TIMEOUT_MS = 10 * 60 * 1000;
const COOKIE_NAME = 'ds_admin_last_active';

function getRemainingMs(): number {
  if (typeof document === 'undefined') return TIMEOUT_MS;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return TIMEOUT_MS;
  const lastActive = parseInt(match.split('=')[1], 10);
  if (isNaN(lastActive)) return TIMEOUT_MS;
  const elapsed = Date.now() - lastActive;
  return Math.max(0, TIMEOUT_MS - elapsed);
}

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function SessionTimer() {
  const router = useRouter();
  const [remaining, setRemaining] = useState(TIMEOUT_MS);

  const logout = useCallback(async () => {
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
    } catch { /* best-effort */ }
    document.cookie = `${COOKIE_NAME}=; path=/admin; max-age=0`;
    document.cookie = 'ds_admin_verified=; path=/admin; max-age=0';
    router.replace('/admin/login?reason=timeout');
  }, [router]);

  useEffect(() => {
    setRemaining(getRemainingMs());

    const interval = setInterval(() => {
      const left = getRemainingMs();
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        logout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [logout]);

  // Update on any user activity (click/keypress) by re-reading the cookie.
  useEffect(() => {
    const bump = () => setRemaining(getRemainingMs());
    window.addEventListener('click', bump, { passive: true });
    window.addEventListener('keydown', bump, { passive: true });
    return () => {
      window.removeEventListener('click', bump);
      window.removeEventListener('keydown', bump);
    };
  }, []);

  const isLow = remaining <= 2 * 60 * 1000;
  const isCritical = remaining <= 60 * 1000;

  return (
    <div
      className={cn(
        'hidden lg:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-mono font-semibold tabular-nums transition-colors',
        isCritical
          ? 'border-red-500/40 bg-red-500/10 text-red-600'
          : isLow
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-600'
          : 'border-[var(--a-border)] bg-[var(--a-subtle)] text-[var(--a-muted)]'
      )}
      title="Session timeout — auto-logout on expiry"
    >
      <Clock className={cn('h-3.5 w-3.5', isCritical && 'animate-pulse')} />
      <span>{formatTime(remaining)}</span>
      {isCritical && (
        <button
          type="button"
          onClick={logout}
          className="ml-1 rounded p-0.5 text-red-600 hover:bg-red-500/20"
          title="Logout now"
        >
          <LogOut className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

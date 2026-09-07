'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createBrowserClient } from '@/lib/supabase/browser';

const TIMEOUT_MS = 10 * 60 * 1000;
const COOKIE_NAME = 'ds_admin_last_active';
const HEARTBEAT_INTERVAL_MS = 60 * 1000;
const ACTIVITY_DEBOUNCE_MS = 5000;

function readCookie(): number {
  if (typeof document === 'undefined') return Date.now();
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return Date.now();
  const ts = parseInt(match.split('=')[1], 10);
  return isNaN(ts) ? Date.now() : ts;
}

function writeCookie(ts: number) {
  document.cookie = `${COOKIE_NAME}=${ts}; path=/admin; max-age=${60 * 60 * 24}; SameSite=Lax`;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Send heartbeat to server — does NOT touch the local timer or cookie. */
async function sendHeartbeat() {
  try {
    await fetch('/api/admin/heartbeat', { method: 'GET', credentials: 'same-origin' });
  } catch { /* offline or network error */ }
}

export function SessionTimer() {
  const router = useRouter();
  const [remaining, setRemaining] = useState(TIMEOUT_MS);
  const lastActivityRef = useRef(readCookie());
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(async () => {
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
    } catch { /* best-effort */ }
    document.cookie = `${COOKIE_NAME}=; path=/admin; max-age=0`;
    document.cookie = 'ds_admin_verified=; path=/admin; max-age=0';
    router.replace('/admin/login?reason=timeout');
  }, [router]);

  /** Bump the local timer — called ONLY by real user activity. */
  const bump = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    writeCookie(now);
    setRemaining(TIMEOUT_MS);

    // Debounce heartbeats — don't spam the server on every keystroke.
    if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    activityTimerRef.current = setTimeout(() => {
      sendHeartbeat();
    }, ACTIVITY_DEBOUNCE_MS);
  }, []);

  // Tick every second — countdown based on last real activity.
  useEffect(() => {
    setRemaining(Math.max(0, TIMEOUT_MS - (Date.now() - lastActivityRef.current)));

    const interval = setInterval(() => {
      const left = Math.max(0, TIMEOUT_MS - (Date.now() - lastActivityRef.current));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        logout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [logout]);

  // Heartbeat — fires every 60s to keep server session alive.
  // Does NOT reset the timer or cookie — only sends to server.
  useEffect(() => {
    heartbeatTimerRef.current = setInterval(() => {
      sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, []);

  // Real user activity — bumps timer + debounced heartbeat.
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'] as const;
    const handler = () => bump();

    for (const event of events) {
      window.addEventListener(event, handler, { passive: true });
    }

    // Returning to tab: bump timer + immediate heartbeat to refresh server session.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        bump();
        sendHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    const onFocus = () => {
      bump();
      sendHeartbeat();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      for (const event of events) {
        window.removeEventListener(event, handler);
      }
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, [bump]);

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
      title="Session timeout — auto-logout on inactivity"
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

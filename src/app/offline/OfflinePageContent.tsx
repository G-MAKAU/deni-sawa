'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export function OfflinePageContent() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <WifiOff className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--a-ink2)] mb-3">You're Offline</h1>
        <p className="text-[var(--a-text)] mb-6 leading-relaxed">
          It looks like you&apos;ve lost your internet connection. Some features may not work until you&apos;re back online.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-brand text-white font-semibold hover:bg-brand-600 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] text-[var(--a-ink2)] font-semibold hover:bg-[var(--a-subtle)] transition-colors"
          >
            Go Home
          </Link>
        </div>
        <p className="mt-6 text-sm text-[var(--a-muted)]">
          Previously visited pages may still be accessible from the browser cache.
        </p>
      </div>
    </main>
  );
}
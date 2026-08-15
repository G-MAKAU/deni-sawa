'use client';

import { createBrowserClient as createSsrBrowserClient } from '@supabase/ssr';

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).'
    );
  }

  return { url, anonKey };
}

/**
 * Browser-side Supabase client for admin auth + session management.
 * Uses `@supabase/ssr` so the session is also mirrored into a cookie — this is
 * what lets the middleware (which only has access to cookies) authenticate the
 * admin after login. Without it the session lived only in localStorage and the
 * middleware bounced the user back to /admin/login.
 */
export function createBrowserClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createSsrBrowserClient(url, anonKey);
}

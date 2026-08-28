import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
const LAST_ACTIVITY_COOKIE = 'ds_admin_last_active';
const ADMIN_VERIFIED_COOKIE = 'ds_admin_verified';
const ADMIN_VERIFIED_MAX_AGE = 60 * 5; // 5 minutes

/**
 * Timeout wrapper — rejects if the promise takes longer than `ms`.
 * Cleans up the timer to avoid unhandled rejections on success.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

const MIDDLEWARE_TIMEOUT_MS = 8000; // 8 seconds — Vercel Edge limit is 30s but we want headroom

/**
 * Admin middleware. Optimised to minimise Supabase round-trips:
 *  1. Quick cookie-based check — if admin was verified recently, skip DB calls.
 *  2. On stale/missing cookie, do a single getUser + admin_users query.
 *  3. Every request still checks inactivity timeout (cookie-only, no DB).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) return NextResponse.next();
  if (pathname === '/admin/login') return NextResponse.next();

  const response = NextResponse.next();

  // --- Inactivity timeout (cookie-only, no network) ---
  const lastActive = request.cookies.get(LAST_ACTIVITY_COOKIE)?.value;
  if (lastActive && Date.now() - parseInt(lastActive, 10) > INACTIVITY_TIMEOUT_MS) {
    // Sign out and redirect — but do it lazily (don't block the response).
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('reason', 'timeout');
    const res = NextResponse.redirect(url);
    res.cookies.delete(LAST_ACTIVITY_COOKIE);
    res.cookies.delete(ADMIN_VERIFIED_COOKIE);
    // Fire-and-forget signOut — Edge won't wait for it.
    createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    ).auth.signOut().catch(() => {});
    return res;
  }

  // --- Fast path: admin was verified recently (within last 5 min) ---
  const verifiedAt = request.cookies.get(ADMIN_VERIFIED_COOKIE)?.value;
  if (verifiedAt && Date.now() - parseInt(verifiedAt, 10) < ADMIN_VERIFIED_MAX_AGE * 1000) {
    // Refresh activity timestamp and serve.
    response.cookies.set(LAST_ACTIVITY_COOKIE, Date.now().toString(), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24,
    });
    return response;
  }

  // --- Slow path: verify session + admin status (bounded by timeout) ---
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
        '',
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) =>
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
        },
      }
    );

    const { data: { user } } = await withTimeout(supabase.auth.getUser(), MIDDLEWARE_TIMEOUT_MS);

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const adminQuery = await withTimeout(
      (async () => supabase.from('admin_users').select('id, is_active').eq('email', user.email!.toLowerCase()).maybeSingle())(),
      MIDDLEWARE_TIMEOUT_MS
    );
    const adminUser = adminQuery.data;

    if (!adminUser || !adminUser.is_active) {
      // Not an admin — sign out lazily.
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('reason', 'unauthorized');
      const res = NextResponse.redirect(url);
      res.cookies.delete(LAST_ACTIVITY_COOKIE);
      res.cookies.delete(ADMIN_VERIFIED_COOKIE);
      supabase.auth.signOut().catch(() => {});
      return res;
    }

    // Admin verified — stamp the cookie so subsequent requests are fast.
    response.cookies.set(ADMIN_VERIFIED_COOKIE, Date.now().toString(), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: ADMIN_VERIFIED_MAX_AGE,
    });
    response.cookies.set(LAST_ACTIVITY_COOKIE, Date.now().toString(), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24,
    });

    return response;
  } catch {
    // Timeout or network error — let the request through to the page layer
    // where API routes have their own auth checks. This prevents 504s from
    // blocking all admin traffic when Supabase is slow.
    response.cookies.set(LAST_ACTIVITY_COOKIE, Date.now().toString(), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24,
    });
    return response;
  }
}

export const config = { matcher: ['/admin/:path*'] };

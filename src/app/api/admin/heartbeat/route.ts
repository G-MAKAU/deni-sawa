import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LAST_ACTIVITY_COOKIE = 'ds_admin_last_active';
const ADMIN_VERIFIED_COOKIE = 'ds_admin_verified';

/**
 * Heartbeat endpoint — refreshes the session inactivity cookie.
 * Called periodically by the client-side SessionTimer when the user is active.
 * No auth check needed — the middleware already gates /admin/* routes.
 * The middleware also refreshes this cookie on every request, but SPA
 * interactions (clicks, typing) don't always trigger middleware.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const now = Date.now().toString();

  response.cookies.set(LAST_ACTIVITY_COOKIE, now, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
  });

  // Also refresh the verified cookie so the middleware fast-path stays alive.
  response.cookies.set(ADMIN_VERIFIED_COOKIE, now, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 5 * 60,
  });

  return response;
}

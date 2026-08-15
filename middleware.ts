import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
const LAST_ACTIVITY_COOKIE = 'ds_admin_last_active';

/**
 * Single /admin entry point. Handles session check, admin validation and a
 * 10-minute inactivity timeout via an httpOnly cookie.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) return NextResponse.next();
  if (pathname === '/admin/login') return NextResponse.next();

  const response = NextResponse.next();

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Inactivity timeout — 10 minutes of no interaction signs the admin out.
  const lastActive = request.cookies.get(LAST_ACTIVITY_COOKIE)?.value;
  if (lastActive && Date.now() - parseInt(lastActive, 10) > INACTIVITY_TIMEOUT_MS) {
    await supabase.auth.signOut();
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('reason', 'timeout');
    const res = NextResponse.redirect(url);
    res.cookies.delete(LAST_ACTIVITY_COOKIE);
    return res;
  }

  // Verify the signed-in user is an active member of the admin team.
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, role, is_active')
    .eq('email', user.email!.toLowerCase())
    .maybeSingle();

  if (!adminUser || !adminUser.is_active) {
    await supabase.auth.signOut();
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('reason', 'unauthorized');
    return NextResponse.redirect(url);
  }

  // Refresh the activity timestamp.
  response.cookies.set(LAST_ACTIVITY_COOKIE, Date.now().toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
  });

  return response;
}

export const config = { matcher: ['/admin/:path*'] };

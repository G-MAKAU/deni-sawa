import { getGoogleAuthUrl, isGoogleOAuthReady } from '@/lib/google-calendar-oauth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (isGoogleOAuthReady()) {
    return Response.json({ ok: true, connected: true, message: 'Google Calendar OAuth is already connected.' });
  }

  const url = getGoogleAuthUrl();
  if (!url) {
    return Response.json({ ok: false, error: 'OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI.' }, { status: 500 });
  }

  return Response.json({ ok: true, connected: false, authUrl: url });
}

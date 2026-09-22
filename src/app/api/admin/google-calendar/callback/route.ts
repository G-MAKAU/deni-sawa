import { exchangeCodeForTokens } from '@/lib/google-calendar-oauth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return new Response(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;">
        <h2>Authorization Failed</h2>
        <p>${error}</p>
        <p>Close this window and try again.</p>
      </body></html>
    `, { status: 400, headers: { 'Content-Type': 'text/html' } });
  }

  if (!code) {
    return new Response(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;">
        <h2>Missing authorization code</h2>
      </body></html>
    `, { status: 400, headers: { 'Content-Type': 'text/html' } });
  }

  const success = await exchangeCodeForTokens(code);

  if (success) {
    return new Response(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;">
        <h2 style="color:#5A9E28;">Connected!</h2>
        <p>Google Calendar OAuth is now set up.</p>
        <p><a href="/admin/settings" style="color:#E8510A;">Return to Settings</a></p>
      </body></html>
    `, { status: 200, headers: { 'Content-Type': 'text/html' } });
  }

  return new Response(`
    <html><body style="font-family:sans-serif;text-align:center;padding:60px;">
      <h2>Token Exchange Failed</h2>
      <p>Check your OAuth credentials and try again.</p>
    </body></html>
  `, { status: 500, headers: { 'Content-Type': 'text/html' } });
}

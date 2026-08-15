import { NextResponse } from 'next/server';

/**
 * Keep-alive endpoint used by the Vercel cron (vercel.json) so the
 * project stays warm and the free tier is not cold-started for visitors.
 */
export async function GET() {
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}

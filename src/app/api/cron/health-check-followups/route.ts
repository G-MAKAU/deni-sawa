import { NextResponse } from 'next/server';
import { runHealthCheckFollowups } from '@/lib/health-check-followups';

export const dynamic = 'force-dynamic';

/**
 * Cron: Send follow-up reminder emails for incomplete health check sessions,
 * then delete sessions older than 8 days that were never completed.
 *
 * Schedule: daily at 08:00 UTC (cron-job.org)
 * Auth: requires CRON_SECRET header.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runHealthCheckFollowups();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('Health check followups cron failed:', error);
    return NextResponse.json({ error: 'Followups cron failed' }, { status: 500 });
  }
}

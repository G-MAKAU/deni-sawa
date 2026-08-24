import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * Cron: DELETE email_log rows older than 30 days where status = 'sent'.
 * Also deletes 'failed' / 'bounced' rows older than 30 days (no point keeping them).
 *
 * Schedule: daily at 03:00 UTC (vercel_.json or cron-job.org)
 * Auth: requires CRON_SECRET header for Vercel/cron-job.org calls.
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Delete sent emails older than 30 days
    const { count: deletedSent, error: errSent } = await supabase
      .from('email_log')
      .delete()
      .eq('status', 'sent')
      .lt('sent_at', cutoff);

    if (errSent) throw errSent;

    // Delete failed/bounced emails older than 30 days
    const { count: deletedFailed, error: errFailed } = await supabase
      .from('email_log')
      .delete()
      .in('status', ['failed', 'bounced'])
      .lt('created_at', cutoff);

    if (errFailed) throw errFailed;

    // Delete pending emails older than 7 days (stuck)
    const stuckCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: deletedStuck, error: errStuck } = await supabase
      .from('email_log')
      .delete()
      .eq('status', 'pending')
      .lt('created_at', stuckCutoff);

    if (errStuck) throw errStuck;

    return NextResponse.json({
      ok: true,
      deleted: {
        sent: deletedSent ?? 0,
        failed: deletedFailed ?? 0,
        stuck: deletedStuck ?? 0,
      },
      cutoff,
    });
  } catch (error) {
    console.error('Email log cleanup failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Cleanup failed', detail: message }, { status: 500 });
  }
}

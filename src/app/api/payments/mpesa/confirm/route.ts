import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/supabase/service';
import { markPaidAndDeliver } from '@/lib/payment';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const schema = z.object({ session_id: z.string().uuid(), reference: z.string().optional() });

/**
 * Marks a session as paid (used by the sandbox/simulated flow and by the UI
 * "I've paid" confirmation) and releases the report + admin notification.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const supabase = getServiceClient();
    await markPaidAndDeliver(supabase, parsed.data.session_id, parsed.data.reference ?? `CONFIRMED-${Date.now()}`);

    const [{ data: session }, { data: report }] = await Promise.all([
      supabase.from('health_check_sessions').select('payment_status, requires_call').eq('id', parsed.data.session_id).maybeSingle(),
      supabase
        .from('health_check_reports')
        .select('report_url_token')
        .eq('session_id', parsed.data.session_id)
        .eq('report_type', 'detailed')
        .maybeSingle(),
    ]);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://denisawa.co.ke';
    return NextResponse.json({
      ok: true,
      payment_status: session?.payment_status,
      requires_call: session?.requires_call,
      report_url_token: report?.report_url_token ?? null,
      report_url: report?.report_url_token ? `${siteUrl}/health-checks/report/${report.report_url_token}` : null,
    });
  } catch (error) {
    console.error('Payment confirm failed:', error);
    return NextResponse.json({ error: 'Payment confirmation failed.' }, { status: 500 });
  }
}

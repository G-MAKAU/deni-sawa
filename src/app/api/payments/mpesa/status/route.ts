import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const schema = z.object({ session_id: z.string().uuid() });

/** Returns the payment status for a session (used to poll after an STK push). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = schema.safeParse({ session_id: url.searchParams.get('session_id') });
  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid session_id is required.' }, { status: 422 });
  }

  try {
    const supabase = getServiceClient();
    const { data: session } = await supabase
      .from('health_check_sessions')
      .select('payment_status, payment_amount, requires_call, report_selection')
      .eq('id', parsed.data.session_id)
      .maybeSingle();
    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });

    return NextResponse.json({
      payment_status: session.payment_status,
      payment_amount: Number(session.payment_amount ?? 0),
      requires_call: session.requires_call,
      report_selection: session.report_selection,
    });
  } catch (error) {
    console.error('Payment status failed:', error);
    return NextResponse.json({ error: 'Failed to load payment status.' }, { status: 500 });
  }
}

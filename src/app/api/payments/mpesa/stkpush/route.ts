import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/supabase/service';
import { initiateStkPush, paymentsSimulated } from '@/lib/mpesa';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const schema = z.object({
  session_id: z.string().uuid(),
  phone: z.string().min(8).max(20).optional(),
});

/** Initiates an M-Pesa STK push for a session's detailed report. */
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
    const { data: session } = await supabase
      .from('health_check_sessions')
      .select('id, whatsapp, payment_amount, payment_status, full_name')
      .eq('id', parsed.data.session_id)
      .maybeSingle();

    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    if (session.payment_status === 'paid') {
      return NextResponse.json({ error: 'This report is already paid.' }, { status: 422 });
    }
    const amount = Number(session.payment_amount ?? 0);
    if (amount <= 0) return NextResponse.json({ error: 'This session has no payable amount.' }, { status: 422 });

    const phone = (parsed.data.phone ?? session.whatsapp ?? '').replace(/\s+/g, '');
    if (!phone) return NextResponse.json({ error: 'A phone number is required to pay.' }, { status: 422 });

    const result = await initiateStkPush({
      amount,
      phone,
      accountReference: `DS${session.id.slice(0, 10).toUpperCase()}`,
      description: 'Health Check Report',
    });

    await supabase
      .from('health_check_sessions')
      .update({ payment_status: 'pending', payment_reference: result.checkout_request_id })
      .eq('id', session.id);

    return NextResponse.json({ simulate: result.simulate, checkout_request_id: result.checkout_request_id, message: result.message });
  } catch (error) {
    console.error('STK push failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Payment request failed.' }, { status: 500 });
  }
}

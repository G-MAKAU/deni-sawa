import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const schema = z.object({
  session_id: z.string().uuid(),
  plan: z.enum(['detailed', 'detailed_call']),
  phone: z.string().trim().max(40).optional(),
});

/**
 * Upgrades an existing summary session to a paid plan (used from the summary
 * report viewer). Sets the report selection + price and marks payment pending;
 * the client then initiates the M-Pesa STK push.
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
    const { data: session } = await supabase
      .from('health_check_sessions')
      .select('id, whatsapp, health_check_id, payment_status')
      .eq('id', parsed.data.session_id)
      .maybeSingle();
    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    if (session.payment_status === 'paid') {
      return NextResponse.json({ error: 'This report is already paid.' }, { status: 422 });
    }

    const { data: check } = await supabase
      .from('health_checks')
      .select('detailed_price, detailed_call_price')
      .eq('id', session.health_check_id)
      .maybeSingle();

    const isCall = parsed.data.plan === 'detailed_call';
    const amount = isCall ? Number(check?.detailed_call_price ?? 0) : Number(check?.detailed_price ?? 0);
    if (amount <= 0) {
      return NextResponse.json({ error: 'No price is configured for this report yet.' }, { status: 422 });
    }

    // Capture a phone number when one is provided (used for the call option).
    const whatsapp = parsed.data.phone?.trim() || session.whatsapp || null;

    // The Detailed + Advisory Call option must have a WhatsApp number.
    if (isCall && !whatsapp) {
      return NextResponse.json(
        { error: 'Whatsapp_required' },
        { status: 422 }
      );
    }

    await supabase
      .from('health_check_sessions')
      .update({
        report_selection: isCall ? 'detailed_call' : 'detailed',
        requires_call: isCall,
        whatsapp: whatsapp ? whatsapp : session.whatsapp,
        payment_amount: amount,
        payment_status: 'pending',
      })
      .eq('id', session.id);

    return NextResponse.json({ ok: true, amount, requires_call: isCall, whatsapp: whatsapp ?? null });
  } catch (error) {
    console.error('Upgrade failed:', error);
    return NextResponse.json({ error: 'Upgrade failed.' }, { status: 500 });
  }
}

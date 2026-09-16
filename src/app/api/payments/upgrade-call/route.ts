import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const schema = z.object({
  session_id: z.string().uuid(),
  phone: z.string().trim().max(40).optional(),
});

/**
 * Upgrades an already-paid detailed report to detailed + advisory call.
 * Charges only the difference: detailed_call_price − detailed_price.
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
      .select('id, whatsapp, health_check_id, payment_status, report_selection, full_name, business_name, preferred_delivery')
      .eq('id', parsed.data.session_id)
      .maybeSingle();
    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });

    // Must already be paid for detailed (not summary, not already detailed_call).
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'This report has not been paid yet.' }, { status: 422 });
    }
    if (session.report_selection === 'detailed_call') {
      return NextResponse.json({ error: 'This report already includes an advisory call.' }, { status: 422 });
    }

    const { data: check } = await supabase
      .from('health_checks')
      .select('detailed_price, detailed_call_price')
      .eq('id', session.health_check_id)
      .maybeSingle();

    const detailedPrice = Number(check?.detailed_price ?? 0);
    const detailedCallPrice = Number(check?.detailed_call_price ?? 0);
    const upgradeAmount = detailedCallPrice - detailedPrice;

    if (upgradeAmount <= 0) {
      return NextResponse.json({ error: 'No upgrade fee is configured for this report.' }, { status: 422 });
    }

    const whatsapp = parsed.data.phone?.trim() || session.whatsapp || null;
    if (!whatsapp) {
      return NextResponse.json({ error: 'Whatsapp_required' }, { status: 422 });
    }

    // Update session: keep payment_status as 'paid' for the original amount,
    // store the upgrade fee as payment_amount for the STK push,
    // flip to detailed_call and set requires_call.
    await supabase
      .from('health_check_sessions')
      .update({
        report_selection: 'detailed_call',
        requires_call: true,
        whatsapp,
        payment_amount: upgradeAmount,
        payment_status: 'pending',
      })
      .eq('id', session.id);

    return NextResponse.json({ ok: true, amount: upgradeAmount, requires_call: true, whatsapp });
  } catch (error) {
    console.error('Call upgrade failed:', error);
    return NextResponse.json({ error: 'Upgrade failed.' }, { status: 500 });
  }
}

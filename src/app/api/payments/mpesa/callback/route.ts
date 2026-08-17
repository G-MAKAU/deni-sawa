import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';
import { markPaidAndDeliver } from '@/lib/payment';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * M-Pesa callback (webhook). The Daraja API POSTs the payment result here;
 * on a successful ResultCode we look up the session by CheckoutRequestID
 * (stored as payment_reference) and release the report.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      Body?: {
        stkCallback?: {
          CheckoutRequestID?: string;
          ResultCode?: number | string;
          ResultDesc?: string;
          CallbackMetadata?: { Item?: Array<{ Name?: string; Value?: unknown }> };
        };
      };
    };

    const callback = body?.Body?.stkCallback;
    if (!callback?.CheckoutRequestID) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    const success = String(callback.ResultCode) === '0';
    const reference = callback.CheckoutRequestID;
    const supabase = getServiceClient();

    const { data: session } = await supabase
      .from('health_check_sessions')
      .select('id')
      .eq('payment_reference', reference)
      .maybeSingle();

    if (session) {
      if (success) {
        await markPaidAndDeliver(supabase, session.id, reference);
      } else {
        await supabase
          .from('health_check_sessions')
          .update({ payment_status: 'failed' })
          .eq('id', session.id);
      }
    }

    // Daraja expects a 200 so it stops retrying.
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('M-Pesa callback failed:', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

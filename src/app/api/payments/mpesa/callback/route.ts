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

    // Extract M-Pesa metadata from the callback payload.
    const items = callback.CallbackMetadata?.Item ?? [];
    const meta = new Map(items.map((i) => [i.Name, i.Value]));
    const mpesaReceipt = (meta.get('MpesaReceiptNumber') as string) ?? null;
    const phoneNumber = (meta.get('PhoneNumber') as string) ?? null;
    const amount = meta.get('Amount') as number | undefined;

    // Look up session by CheckoutRequestID.
    const { data: session } = await supabase
      .from('health_check_sessions')
      .select('id, payment_amount')
      .eq('payment_reference', reference)
      .maybeSingle();

    // Log every callback attempt in the payments table for audit.
    await supabase.from('mpesa_payments').insert({
      session_id: session?.id ?? null,
      checkout_request_id: reference,
      mpesa_receipt: mpesaReceipt,
      phone_number: phoneNumber,
      amount: amount ?? session?.payment_amount ?? 0,
      status: success ? 'success' : 'failed',
      result_code: String(callback.ResultCode),
      result_desc: callback.ResultDesc ?? null,
      raw_callback: body,
    });

    if (session) {
      if (success) {
        // Update the session with the receipt number for quick reference.
        if (mpesaReceipt) {
          await supabase
            .from('health_check_sessions')
            .update({ mpesa_receipt: mpesaReceipt })
            .eq('id', session.id);
        }
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

import { NextResponse } from 'next/server';
import { initiateStkPush, paymentsSimulated } from '@/lib/mpesa';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Lightweight test endpoint — sends an STK push with a phone + amount
 * directly (no Supabase session lookup).  For credential validation only.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { phone, amount } = (body ?? {}) as { phone?: string; amount?: number };
  if (!phone || !amount || amount <= 0) {
    return NextResponse.json({ error: 'phone and a positive amount are required.' }, { status: 422 });
  }

  const simulated = paymentsSimulated();
  try {
    const result = await initiateStkPush({
      amount,
      phone,
      accountReference: `TEST${Date.now()}`,
      description: 'Credential Test',
    });

    return NextResponse.json({
      ok: true,
      simulate: result.simulate,
      checkout_request_id: result.checkout_request_id,
      message: result.message,
      env: {
        simulated,
        mpesa_env: process.env.MPESA_ENV ?? 'sandbox',
        has_consumer_key: Boolean(process.env.MPESA_CONSUMER_KEY),
        has_consumer_secret: Boolean(process.env.MPESA_CONSUMER_SECRET),
        has_passkey: Boolean(process.env.MPESA_PASSKEY),
        has_shortcode: Boolean(process.env.MPESA_SHORTCODE),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'STK push failed.',
        env: {
          simulated,
          mpesa_env: process.env.MPESA_ENV ?? 'sandbox',
          has_consumer_key: Boolean(process.env.MPESA_CONSUMER_KEY),
          has_consumer_secret: Boolean(process.env.MPESA_CONSUMER_SECRET),
          has_passkey: Boolean(process.env.MPESA_PASSKEY),
          has_shortcode: Boolean(process.env.MPESA_SHORTCODE),
        },
      },
      { status: 500 },
    );
  }
}

/** Returns current credential status (no secrets exposed). */
export async function GET() {
  return NextResponse.json({
    simulated: paymentsSimulated(),
    mpesa_env: process.env.MPESA_ENV ?? 'sandbox',
    has_consumer_key: Boolean(process.env.MPESA_CONSUMER_KEY),
    has_consumer_secret: Boolean(process.env.MPESA_CONSUMER_SECRET),
    has_passkey: Boolean(process.env.MPESA_PASSKEY),
    has_shortcode: Boolean(process.env.MPESA_SHORTCODE),
  });
}

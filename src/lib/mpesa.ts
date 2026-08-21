/**
 * M-Pesa (Daraja API) helpers for the health check report payments.
 * Fully functional once the sandbox/production credentials are added to env;
 * when no credentials are configured, STK push is simulated so the flow can
 * be built and tested (PAYMENTS_SIMULATE=true also forces simulation).
 */

const MPESA_API_BASE = (): string =>
  process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

function hasCredentials(): boolean {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_PASSKEY &&
      process.env.MPESA_SHORTCODE
  );
}

export function paymentsSimulated(): boolean {
  return process.env.PAYMENTS_SIMULATE === 'true' || !hasCredentials();
}

async function getAccessToken(): Promise<string> {
  const url = `${MPESA_API_BASE()}/oauth/v1/generate?grant_type=client_credentials`;
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  if (!res.ok) throw new Error(`M-Pesa auth failed (${res.status})`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('M-Pesa auth returned no token');
  return data.access_token;
}

export interface StkPushResult {
  simulate: boolean;
  checkout_request_id: string;
  message: string;
}

/** Initiates an STK push to the customer's phone for the given amount (KES). */
export async function initiateStkPush(options: {
  amount: number;
  phone: string;
  accountReference: string;
  description: string;
}): Promise<StkPushResult> {
  if (paymentsSimulated()) {
    return {
      simulate: true,
      checkout_request_id: `SIM-${Date.now()}`,
      message: 'Payment request simulated — confirm it in the sandbox to release your report.',
    };
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const shortcode = process.env.MPESA_SHORTCODE as string;
  const password = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');
  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://deni-sawa.vercel.app'}/api/payments/mpesa/callback`;

  const token = await getAccessToken();
  const res = await fetch(`${MPESA_API_BASE()}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(options.amount),
      PartyA: options.phone.replace(/\D/g, ''),
      PartyB: shortcode,
      PhoneNumber: options.phone.replace(/\D/g, ''),
      CallBackURL: callbackUrl,
      AccountReference: options.accountReference.slice(0, 12),
      TransactionDesc: options.description.slice(0, 13),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { CheckoutRequestID?: string; ResponseCode?: string };
  if (!res.ok || data.ResponseCode !== '0' || !data.CheckoutRequestID) {
    throw new Error(`M-Pesa STK push failed (${res.status}${data.ResponseCode ? ` code ${data.ResponseCode}` : ''})`);
  }

  return { simulate: false, checkout_request_id: data.CheckoutRequestID, message: 'STK push sent to your phone. Enter your PIN to approve.' };
}

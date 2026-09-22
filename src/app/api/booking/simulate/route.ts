import { NextRequest } from 'next/server';
import { dbQuery } from '@/lib/db';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';
import { site } from '@/data/site';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (process.env.MPESA_ENV === 'production' && process.env.PAYMENTS_SIMULATE !== 'true') {
    return Response.json({ ok: false, error: 'Simulation is disabled in production.' }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch { /* validation below */ }

  const reference = typeof body.reference === 'string' ? body.reference : '';
  if (!reference) {
    return Response.json({ ok: false, error: 'Reference is required.' }, { status: 400 });
  }

  try {
    const bkRows = await dbQuery<Array<{ id: number; status: string; amount: number; customer_name: string; customer_email: string }>>(
      'SELECT id, status, amount, customer_name, customer_email FROM bookings WHERE reference = ?',
      [reference]
    );

    if (bkRows.length === 0) {
      return Response.json({ ok: false, error: 'Booking not found.' }, { status: 404 });
    }

    const booking = bkRows[0];
    if (booking.status !== 'pending_payment') {
      return Response.json({ ok: false, error: 'Booking is not pending payment.' }, { status: 400 });
    }

    await dbQuery(
      `UPDATE bookings SET status = 'paid', payment_confirmed_at = NOW() WHERE reference = ?`,
      [reference]
    );

    await dbQuery(
      `UPDATE payments SET status = 'success', mpesa_receipt = ? WHERE booking_reference = ? AND status = 'initiated'`,
      [`SIM${Date.now()}`, reference]
    );

    const firstName = booking.customer_name.split(' ')[0];
    const bookingUrl = `${site.url}/booking?ref=${reference}`;

    const emailBody = `
      <div style="text-align:center;margin:0 0 28px;">
        <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#5A9E28,#48801F);line-height:56px;margin:0 auto 16px;">
          <span style="font-size:24px;color:#FFFFFF;">&#36;</span>
        </div>
      </div>
      <h1 style="margin:0 0 12px;text-align:center;">Payment Received!</h1>
      <p style="margin:0 0 20px;text-align:center;color:#6B7280;font-size:14px;">Thank you, ${firstName}. Your payment has been confirmed.</p>
      <div style="background:#F9F7F5;border-radius:8px;padding:20px 24px;margin:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;width:120px;">Amount</td><td style="padding:8px 0;font-weight:600;">KES ${Number(booking.amount).toLocaleString()}</td></tr>
          <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;">Reference</td><td style="padding:8px 0;font-weight:600;font-family:monospace;">${reference}</td></tr>
        </table>
      </div>
      <div style="background:#FDF3EC;border-radius:8px;padding:20px 24px;margin:0 0 24px;border-left:3px solid #E8510A;">
        <p style="margin:0;font-size:14px;color:#1A1A1A;line-height:1.6;"><strong>Next step:</strong> Select your preferred date and time for the appointment.</p>
      </div>
      <div style="text-align:center;margin:28px 0 0;">
        <a href="${bookingUrl}" style="display:inline-block;background:#E8510A;color:#FFFFFF !important;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:13px 28px;border-radius:6px;">Select Your Booking Date</a>
      </div>`;

    sendEmail({
      to: booking.customer_email,
      toName: booking.customer_name,
      subject: `Payment Confirmed — Select Your Booking Date (${reference})`,
      html: buildBrandedEmailHtml(emailBody, `Your payment is confirmed. Select your booking date.`),
    }).then((r) => {
      if (!r.ok) console.error('booking/simulate: email failed:', r.error);
    });

    return Response.json({ ok: true, message: 'Payment simulated successfully.' }, { status: 200 });
  } catch (err) {
    console.error('booking/simulate: error:', err);
    return Response.json({ ok: false, error: 'Internal server error.' }, { status: 500 });
  }
}

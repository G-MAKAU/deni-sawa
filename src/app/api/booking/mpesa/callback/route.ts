import { NextRequest } from 'next/server';
import { dbQuery, getBookingPool } from '@/lib/db';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';
import { site } from '@/data/site';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch { /* respond 200 anyway */ }

  try {
    const bodyObj = body as Record<string, unknown>;
    const bodyInner = (bodyObj.Body ?? {}) as Record<string, unknown>;
    const callback = (bodyInner.stkCallback ?? {}) as Record<string, unknown>;
    if (!callback || Object.keys(callback).length === 0) {
      return Response.json({ ok: true });
    }

    const resultCode = callback.ResultCode as number;
    const merchantRequestId = callback.MerchantRequestID as string;
    const checkoutRequestId = callback.CheckoutRequestID as string;

    const cbMeta = (callback.CallbackMetadata ?? {}) as Record<string, unknown>;
    const metadata = (cbMeta.Item ?? []) as Array<{ Name: string; Value: unknown }>;
    const getMeta = (name: string) => metadata.find((m) => m.Name === name)?.Value;

    const receipt = getMeta('MpesaReceiptNumber') as string | undefined;
    const phone = getMeta('PhoneNumber') as string | undefined;

    const pool = getBookingPool();

    if (resultCode !== 0) {
      if (checkoutRequestId) {
        await pool.query(
          `UPDATE payments SET status = 'failed', mpesa_merchant_request_id = ?, raw_callback = ? WHERE mpesa_checkout_id = ?`,
          [merchantRequestId ?? null, JSON.stringify(body), checkoutRequestId]
        );
      }
      return Response.json({ ok: true });
    }

    const payRows = await dbQuery<Array<{ booking_reference: string }>>(
      'SELECT booking_reference FROM payments WHERE mpesa_checkout_id = ?',
      [checkoutRequestId]
    );

    if (payRows.length === 0) {
      console.error('booking/callback: no payment found for checkout', checkoutRequestId);
      return Response.json({ ok: true });
    }

    const reference = payRows[0].booking_reference;

    await pool.query(
      `UPDATE payments SET status = 'success', mpesa_receipt = ?, mpesa_merchant_request_id = ?, phone_number = ?, raw_callback = ? WHERE mpesa_checkout_id = ?`,
      [receipt ?? null, merchantRequestId ?? null, phone ? String(phone) : null, JSON.stringify(body), checkoutRequestId]
    );

    await pool.query(
      `UPDATE bookings SET status = 'paid', payment_confirmed_at = NOW() WHERE reference = ?`,
      [reference]
    );

    const bkRows = await dbQuery<Array<{ customer_name: string; customer_email: string; amount: number }>>(
      'SELECT customer_name, customer_email, amount FROM bookings WHERE reference = ?',
      [reference]
    );

    if (bkRows.length > 0) {
      const booking = bkRows[0];
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
            <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;">M-Pesa Receipt</td><td style="padding:8px 0;font-weight:600;font-family:monospace;">${receipt ?? 'N/A'}</td></tr>
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
        html: buildBrandedEmailHtml(emailBody, `Your payment of KES ${Number(booking.amount).toLocaleString()} is confirmed.`),
      }).catch(() => {});

      await dbQuery(
        `INSERT INTO email_logs (booking_reference, email_type, subject, recipient_email, status) VALUES (?, 'payment_confirmation', ?, ?, 'sent')`,
        [reference, `Payment Confirmed — Select Your Booking Date (${reference})`, booking.customer_email]
      );
    }
  } catch (err) {
    console.error('booking/callback: processing error:', err);
  }

  return Response.json({ ok: true });
}

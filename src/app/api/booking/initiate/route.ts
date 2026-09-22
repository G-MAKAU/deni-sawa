import { NextRequest } from 'next/server';
import { dbQuery } from '@/lib/db';
import { initiateStkPush, paymentsSimulated } from '@/lib/mpesa';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';
import { site } from '@/data/site';

export const dynamic = 'force-dynamic';

function clean(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isPhone(v: string): boolean {
  return /^\+?[0-9][0-9\s()-]{6,19}$/.test(v);
}

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  return digits;
}

function makeReference(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BK-${ymd}-${rand}`;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch { /* validation below */ }

  const serviceId = Number(body.serviceId);
  const name = clean(body.name, 150);
  const phone = clean(body.phone, 20);
  const email = clean(body.email, 150);
  const notes = clean(body.notes, 500);
  const rawAmount = body.amount != null ? Number(body.amount) : undefined;

  const errors: string[] = [];
  if (!serviceId || isNaN(serviceId)) errors.push('Please select a service.');
  if (!name) errors.push('Please provide your full name.');
  if (!phone) errors.push('Please provide your phone number.');
  else if (!isPhone(phone)) errors.push('Please provide a valid phone number.');
  if (!email) errors.push('Please provide your email address.');
  else if (!isEmail(email)) errors.push('Please provide a valid email address.');
  if (errors.length > 0) {
    return Response.json({ ok: false, errors }, { status: 200 });
  }

  try {
    const services = await dbQuery<Array<{ id: number; name: string; price: number; duration_minutes: number; allow_custom_amount: number }>>(
      'SELECT id, name, price, duration_minutes, allow_custom_amount FROM services WHERE id = ? AND is_active = 1',
      [serviceId]
    );

    if (services.length === 0) {
      return Response.json({ ok: false, errors: ['Selected service not found.'] }, { status: 200 });
    }

    const service = services[0];
    const reference = makeReference();

    let amount = Number(service.price);
    if (service.allow_custom_amount === 1 && rawAmount != null && !isNaN(rawAmount) && rawAmount >= service.price) {
      amount = rawAmount;
    }

    await dbQuery(
      `INSERT INTO bookings (reference, service_id, customer_name, customer_email, customer_phone, amount, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_payment')`,
      [reference, serviceId, name, email, phone, amount, notes || null]
    );

    const stkResult = await initiateStkPush({
      amount,
      phone,
      accountReference: reference,
      description: `Booking: ${service.name}`,
    });

    await dbQuery(
      `INSERT INTO payments (booking_reference, mpesa_checkout_id, phone_number, amount, status)
       VALUES (?, ?, ?, ?, 'initiated')`,
      [reference, stkResult.checkout_request_id, normalisePhone(phone), amount]
    );

    // In dev/simulation mode, auto-mark as paid so the user skips the waiting screen
    if (stkResult.simulate) {
      await dbQuery(
        `UPDATE bookings SET status = 'paid', payment_confirmed_at = NOW() WHERE reference = ?`,
        [reference]
      );
      await dbQuery(
        `UPDATE payments SET status = 'success', mpesa_receipt = ? WHERE booking_reference = ? AND status = 'initiated'`,
        [`SIM${Date.now()}`, reference]
      );

      const firstName = name.split(' ')[0];
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
            <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;width:120px;">Amount</td><td style="padding:8px 0;font-weight:600;">KES ${Number(amount).toLocaleString()}</td></tr>
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
        to: email,
        toName: name,
        subject: `Payment Confirmed — Select Your Booking Date (${reference})`,
        html: buildBrandedEmailHtml(emailBody, `Your payment of KES ${Number(amount).toLocaleString()} is confirmed. Select your booking date.`),
      }).catch((e) => console.error('booking/initiate: email failed:', e));

      await dbQuery(
        `INSERT INTO email_logs (booking_reference, email_type, subject, recipient_email, status) VALUES (?, 'payment_confirmation', ?, ?, 'sent')`,
        [reference, `Payment Confirmed — Select Your Booking Date (${reference})`, email]
      );
    }

    return Response.json({
      ok: true,
      reference,
      checkoutRequestId: stkResult.checkout_request_id,
      simulate: stkResult.simulate,
      message: stkResult.message,
    }, { status: 200 });
  } catch (err) {
    console.error('booking/initiate: error:', err);
    return Response.json({ ok: false, errors: ['An unexpected error occurred. Please try again.'] }, { status: 500 });
  }
}

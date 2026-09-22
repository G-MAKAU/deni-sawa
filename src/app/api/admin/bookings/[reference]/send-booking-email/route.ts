import { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { dbQuery } from '@/lib/db';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';
import { site } from '@/data/site';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  try {
    await requireAdmin(request, 'update');
    const { reference } = await context.params;

    const rows = await dbQuery<Array<{ status: string; customer_name: string; customer_email: string }>>(
      `SELECT status, customer_name, customer_email FROM bookings WHERE reference = ?`,
      [reference]
    );
    if (rows.length === 0) {
      return Response.json({ ok: false, error: 'Booking not found.' }, { status: 404 });
    }
    const booking = rows[0];

    if (booking.status !== 'paid') {
      return Response.json({ ok: false, error: 'Only paid bookings can receive the booking email.' }, { status: 400 });
    }

    const firstName = booking.customer_name.split(' ')[0];
    const bookingUrl = `${site.url}/booking?ref=${reference}`;

    const emailBody = `
      <h1 style="margin:0 0 12px;text-align:center;">Book Your Appointment Date</h1>
      <p style="margin:0 0 20px;text-align:center;color:#6B7280;font-size:14px;">Hi ${firstName}, your payment has been confirmed. Please select your preferred date and time below.</p>
      <div style="background:#F9F7F5;border-radius:8px;padding:20px 24px;margin:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;width:100px;">Reference</td><td style="padding:8px 0;font-weight:600;font-family:monospace;">${reference}</td></tr>
          <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;">Status</td><td style="padding:8px 0;font-weight:600;">Paid</td></tr>
        </table>
      </div>
      <div style="background:#FDF3EC;border-radius:8px;padding:20px 24px;margin:0 0 24px;border-left:3px solid #E8510A;">
        <p style="margin:0;font-size:14px;color:#1A1A1A;line-height:1.6;"><strong>Next step:</strong> Select your preferred date and time for the appointment. You have 3 days from the booking creation date to choose or change your date.</p>
      </div>
      <div style="text-align:center;margin:28px 0 0;">
        <a href="${bookingUrl}" style="display:inline-block;background:#E8510A;color:#FFFFFF !important;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:13px 28px;border-radius:6px;">Select Your Booking Date</a>
      </div>`;

    const result = await sendEmail({
      to: booking.customer_email,
      toName: booking.customer_name,
      subject: `Book Your Appointment Date (${reference}) — ${site.name}`,
      html: buildBrandedEmailHtml(emailBody, `Your payment is confirmed. Select your booking date.`),
    });

    await dbQuery(
      `INSERT INTO email_logs (booking_reference, email_type, subject, recipient_email, status, error_message)
       VALUES (?, 'booking_date_prompt', ?, ?, ?, ?)`,
      [reference, `Book Your Appointment Date (${reference}) — ${site.name}`, booking.customer_email, result.ok ? 'sent' : 'failed', result.ok ? null : result.error ?? 'Unknown error']
    );

    return Response.json({ ok: true, message: 'Booking email sent successfully.' });
  } catch (error) {
    return jsonAdminError(error, 'Failed to send booking email');
  }
}

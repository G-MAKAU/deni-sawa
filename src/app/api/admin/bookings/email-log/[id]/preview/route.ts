import { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { dbQuery } from '@/lib/db';
import { buildBrandedEmailHtml } from '@/lib/email';
import { site } from '@/data/site';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

interface EmailLogRow {
  id: number;
  booking_reference: string;
  email_type: string;
  subject: string | null;
  recipient_email: string;
}

interface BookingRow {
  reference: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: string;
  booked_date: string | null;
  booked_time: string | null;
  meet_link: string | null;
  service_name: string | null;
  duration_minutes: number | null;
}

function buildEmailPreview(log: EmailLogRow, booking: BookingRow | null): { subject: string; html: string; previewText: string } {
  const ref = log.booking_reference;
  const firstName = booking?.customer_name?.split(' ')[0] ?? 'Customer';
  const bookingUrl = `${site.url}/booking?ref=${ref}`;

  switch (log.email_type) {
    case 'payment_confirmation': {
      const subject = log.subject || `Payment Confirmed — Select Your Booking Date (${ref})`;
      const body = `
        <h1 style="margin:0 0 12px;text-align:center;">Payment Received!</h1>
        <p style="margin:0 0 20px;text-align:center;color:#6B7280;font-size:14px;">Thank you, ${firstName}. Your payment has been confirmed.</p>
        <div style="background:#F9F7F5;border-radius:8px;padding:20px 24px;margin:0 0 24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;width:120px;">Amount</td><td style="padding:8px 0;font-weight:600;">KES ${Number(booking?.amount ?? 0).toLocaleString()}</td></tr>
            <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;">Reference</td><td style="padding:8px 0;font-weight:600;font-family:monospace;">${ref}</td></tr>
          </table>
        </div>
        <div style="background:#FDF3EC;border-radius:8px;padding:20px 24px;margin:0 0 24px;border-left:3px solid #E8510A;">
          <p style="margin:0;font-size:14px;color:#1A1A1A;line-height:1.6;"><strong>Next step:</strong> Select your preferred date and time for the appointment.</p>
        </div>
        <div style="text-align:center;margin:28px 0 0;">
          <a href="${bookingUrl}" style="display:inline-block;background:#E8510A;color:#FFFFFF !important;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:13px 28px;border-radius:6px;">Select Your Booking Date</a>
        </div>`;
      return { subject, html: buildBrandedEmailHtml(body, `Your payment is confirmed. Select your booking date.`), previewText: `Payment of KES ${Number(booking?.amount ?? 0).toLocaleString()} confirmed for ${ref}.` };
    }
    case 'booking_confirmation': {
      const subject = log.subject || `Booking Confirmed — ${booking?.service_name ?? 'Consultation'} (${ref})`;
      const serviceName = booking?.service_name ?? 'Consultation';
      const duration = booking?.duration_minutes ?? 60;
      const formattedDate = booking?.booked_date
        ? new Date(booking.booked_date + 'T12:00:00Z').toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : 'TBD';
      const timeStr = booking?.booked_time?.slice(0, 5) ?? 'TBD';
      const meetSection = booking?.meet_link
        ? `<div style="text-align:center;margin:0 0 24px;"><a href="${booking.meet_link}" style="display:inline-block;background:#5A9E28;color:#FFFFFF !important;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:13px 28px;border-radius:6px;">Join Google Meet</a></div>`
        : '';
      const body = `
        <h1 style="margin:0 0 12px;text-align:center;">Booking Confirmed!</h1>
        <p style="margin:0 0 20px;text-align:center;color:#6B7280;font-size:14px;">Your appointment has been successfully scheduled.</p>
        <div style="background:#F9F7F5;border-radius:8px;padding:24px;margin:0 0 24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;width:100px;">Service</td><td style="padding:8px 0;font-weight:600;">${serviceName}</td></tr>
            <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;">Date</td><td style="padding:8px 0;font-weight:600;">${formattedDate}</td></tr>
            <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;">Time</td><td style="padding:8px 0;font-weight:600;">${timeStr} EAT (${duration} min)</td></tr>
            <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;">Reference</td><td style="padding:8px 0;font-weight:600;font-family:monospace;">${ref}</td></tr>
            <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;">Amount</td><td style="padding:8px 0;font-weight:600;">KES ${Number(booking?.amount ?? 0).toLocaleString()}</td></tr>
          </table>
        </div>
        ${meetSection}
        <div style="background:#FDF3EC;border-radius:8px;padding:20px 24px;margin:0 0 24px;border-left:3px solid #E8510A;">
          <p style="margin:0;font-size:14px;color:#1A1A1A;line-height:1.6;"><strong>What happens next?</strong><br/>A calendar invite has been sent to your email. Please arrive 5 minutes before your scheduled time.</p>
        </div>`;
      return { subject, html: buildBrandedEmailHtml(body, `Your ${serviceName} booking is confirmed for ${formattedDate} at ${timeStr}.`), previewText: `Your ${serviceName} booking is confirmed for ${formattedDate} at ${timeStr}.` };
    }
    case 'booking_date_prompt': {
      const subject = log.subject || `Book Your Appointment Date (${ref}) — ${site.name}`;
      const body = `
        <h1 style="margin:0 0 12px;text-align:center;">Book Your Appointment Date</h1>
        <p style="margin:0 0 20px;text-align:center;color:#6B7280;font-size:14px;">Hi ${firstName}, your payment has been confirmed. Please select your preferred date and time below.</p>
        <div style="background:#F9F7F5;border-radius:8px;padding:20px 24px;margin:0 0 24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;width:100px;">Reference</td><td style="padding:8px 0;font-weight:600;font-family:monospace;">${ref}</td></tr>
            <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;">Status</td><td style="padding:8px 0;font-weight:600;">Paid</td></tr>
          </table>
        </div>
        <div style="background:#FDF3EC;border-radius:8px;padding:20px 24px;margin:0 0 24px;border-left:3px solid #E8510A;">
          <p style="margin:0;font-size:14px;color:#1A1A1A;line-height:1.6;"><strong>Next step:</strong> Select your preferred date and time for the appointment. You have 3 days from the booking creation date to choose or change your date.</p>
        </div>
        <div style="text-align:center;margin:28px 0 0;">
          <a href="${bookingUrl}" style="display:inline-block;background:#E8510A;color:#FFFFFF !important;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:13px 28px;border-radius:6px;">Select Your Booking Date</a>
        </div>`;
      return { subject, html: buildBrandedEmailHtml(body, `Your payment is confirmed. Select your booking date.`), previewText: `Your payment is confirmed. Select your booking date.` };
    }
    case 'booking_cancellation': {
      const subject = log.subject || `Booking Cancelled — ${ref} — ${site.name}`;
      const body = `
        <h1>Booking Cancelled</h1>
        <p>Hi ${firstName},</p>
        <p>Your booking <strong>${ref}</strong> for <strong>${booking?.service_name ?? 'your consultation'}</strong>
          ${booking?.booked_date ? ` on <strong>${booking.booked_date}</strong>${booking.booked_time ? ` at ${booking.booked_time.slice(0, 5)}` : ''}` : ''}
          has been cancelled.
        </p>
        <p>If you believe this was done in error, please contact us at <a href="mailto:${site.email}">${site.email}</a> or call <strong>${site.phone}</strong>.</p>
        <p>We look forward to working with you in the future.</p>`;
      return { subject, html: buildBrandedEmailHtml(body, `Your booking ${ref} has been cancelled.`), previewText: `Your booking ${ref} has been cancelled.` };
    }
    default: {
      const subject = log.subject || `Email regarding booking ${ref}`;
      const body = `<p>This is a resent email for booking <strong>${ref}</strong>.</p><p>Email type: ${log.email_type}</p>`;
      return { subject, html: buildBrandedEmailHtml(body, `Email regarding booking ${ref}`), previewText: `Email regarding booking ${ref}` };
    }
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request, 'read');
    const { id } = await context.params;

    const rows = await dbQuery<EmailLogRow[]>(
      'SELECT * FROM email_logs WHERE id = ?',
      [id]
    );
    const log = rows[0];
    if (!log) {
      return Response.json({ ok: false, error: 'Email log entry not found' }, { status: 404 });
    }

    const bookingRows = await dbQuery<BookingRow[]>(
      `SELECT b.reference, b.customer_name, b.customer_email, b.amount, b.status, b.booked_date, b.booked_time, b.meet_link,
              s.name as service_name, s.duration_minutes
       FROM bookings b LEFT JOIN services s ON b.service_id = s.id
       WHERE b.reference = ?`,
      [log.booking_reference]
    );
    const booking = bookingRows[0] ?? null;

    const preview = buildEmailPreview(log, booking);

    return Response.json({ ok: true, ...preview, recipient: log.recipient_email });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load email preview');
  }
}

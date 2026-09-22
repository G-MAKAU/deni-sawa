import { NextRequest } from 'next/server';
import { dbQuery } from '@/lib/db';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar';
import { paymentsSimulated } from '@/lib/mpesa';
import { site } from '@/data/site';

export const dynamic = 'force-dynamic';

interface BookingRow {
  id: number;
  reference: string;
  status: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_name: string;
  duration_minutes: number;
  created_at: string;
  google_event_id: string | null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch { /* validation below */ }

  if (!reference || reference.length > 36) {
    return Response.json({ ok: false, error: 'Invalid reference.' }, { status: 400 });
  }

  const date = typeof body.date === 'string' ? body.date : '';
  const time = typeof body.time === 'string' ? body.time : '';

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ ok: false, error: 'Please provide a valid date.' }, { status: 200 });
  }
  if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    return Response.json({ ok: false, error: 'Please provide a valid time.' }, { status: 200 });
  }

  const dayOfWeek = new Date(date + 'T12:00:00Z').getUTCDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return Response.json({ ok: false, error: 'Bookings are only available Monday through Friday.' }, { status: 200 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookingDate = new Date(date + 'T12:00:00Z');
  bookingDate.setHours(0, 0, 0, 0);
  if (bookingDate <= today) {
    return Response.json({ ok: false, error: 'Please select a date from tomorrow onwards.' }, { status: 200 });
  }

  try {
    const bkRows = await dbQuery<BookingRow[]>(
      `SELECT b.id, b.reference, b.status, b.amount, b.customer_name, b.customer_email, b.customer_phone,
              b.created_at, b.google_event_id,
              s.name AS service_name, s.duration_minutes
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       WHERE b.reference = ?`,
      [reference]
    );

    if (bkRows.length === 0) {
      return Response.json({ ok: false, error: 'Booking not found.' }, { status: 404 });
    }

    const booking = bkRows[0];

    // In simulation mode, auto-mark as paid if still pending_payment
    if (booking.status === 'pending_payment' && paymentsSimulated()) {
      await dbQuery(
        `UPDATE bookings SET status = 'paid', payment_confirmed_at = NOW() WHERE reference = ?`,
        [reference]
      );
      await dbQuery(
        `UPDATE payments SET status = 'success', mpesa_receipt = ? WHERE booking_reference = ? AND status = 'initiated'`,
        [`SIM${Date.now()}`, reference]
      );
      booking.status = 'paid';
    }

    if (booking.status !== 'paid' && booking.status !== 'booked') {
      return Response.json({ ok: false, error: 'Booking must be paid before scheduling.' }, { status: 400 });
    }

    // If rescheduling a booked appointment, enforce 3-day window
    if (booking.status === 'booked') {
      const created = new Date(booking.created_at);
      const deadline = new Date(created);
      deadline.setDate(deadline.getDate() + 3);
      if (new Date() >= deadline) {
        return Response.json({ ok: false, error: 'The 3-day change window has closed. Please contact us to reschedule.' }, { status: 400 });
      }
      // Delete old calendar event if rescheduling
      if (booking.google_event_id) {
        await deleteCalendarEvent(booking.google_event_id);
      }
    }

    const conflictRows = await dbQuery<Array<{ id: number }>>(
      `SELECT id FROM bookings WHERE booked_date = ? AND booked_time = ? AND status = 'booked' AND reference != ? LIMIT 1`,
      [date, time + ':00', reference]
    );

    if (conflictRows.length > 0) {
      return Response.json({ ok: false, error: 'This time slot is no longer available. Please choose another.' }, { status: 200 });
    }

    // Create Google Calendar event with Meet link
    const serviceName = booking.service_name;
    const duration = booking.duration_minutes;
    const calendarResult = await createCalendarEvent({
      summary: `${serviceName} — ${booking.customer_name}`,
      description: [
        `Service: ${serviceName}`,
        `Client: ${booking.customer_name}`,
        `Email: ${booking.customer_email}`,
        `Phone: ${booking.customer_phone}`,
        `Reference: ${reference}`,
        `Amount paid: KES ${Number(booking.amount).toLocaleString()}`,
      ].join('\n'),
      startDate: date,
      startTime: time,
      durationMinutes: duration,
      attendeeEmail: booking.customer_email,
      attendeeName: booking.customer_name,
    });

// Determine Meet link: dynamic (from calendar) > static fallback > none
    const meetLink = calendarResult.meetLink ?? process.env.GOOGLE_MEET_LINK ?? null;

    // Update booking with date/time, Google event ID and Meet link
    await dbQuery(
      `UPDATE bookings SET booked_date = ?, booked_time = ?, status = 'booked', booking_confirmed_at = NOW(), google_event_id = ?, meet_link = ? WHERE reference = ?`,
      [date, time + ':00', calendarResult.eventId, meetLink, reference]
    );

    const formattedDate = new Date(date + 'T12:00:00Z').toLocaleDateString('en-KE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    // Build Meet link section for email (uses dynamic or static fallback)
    const meetSection = meetLink
      ? `<div style="text-align:center;margin:0 0 24px;">
           <a href="${meetLink}" style="display:inline-block;background:#5A9E28;color:#FFFFFF !important;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:13px 28px;border-radius:6px;">Join Google Meet</a>
         </div>`
      : '';

    const emailBody = `
      <div style="text-align:center;margin:0 0 28px;">
        <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#E8510A,#C44508);line-height:56px;margin:0 auto 16px;">
          <span style="font-size:24px;color:#FFFFFF;">&#10003;</span>
        </div>
      </div>
      <h1 style="margin:0 0 12px;text-align:center;">Booking Confirmed!</h1>
      <p style="margin:0 0 20px;text-align:center;color:#6B7280;font-size:14px;">Your appointment has been successfully scheduled.</p>
      <div style="background:#F9F7F5;border-radius:8px;padding:24px;margin:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;width:100px;">Service</td><td style="padding:8px 0;font-weight:600;">${serviceName}</td></tr>
          <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;">Date</td><td style="padding:8px 0;font-weight:600;">${formattedDate}</td></tr>
          <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;">Time</td><td style="padding:8px 0;font-weight:600;">${time} EAT (${duration} min)</td></tr>
          <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;">Reference</td><td style="padding:8px 0;font-weight:600;font-family:monospace;">${reference}</td></tr>
          <tr><td style="padding:8px 0;color:#8A857F;font-size:13px;">Amount</td><td style="padding:8px 0;font-weight:600;">KES ${Number(booking.amount).toLocaleString()}</td></tr>
        </table>
      </div>
      ${meetSection}
      <div style="background:#FDF3EC;border-radius:8px;padding:20px 24px;margin:0 0 24px;border-left:3px solid #E8510A;">
        <p style="margin:0;font-size:14px;color:#1A1A1A;line-height:1.6;"><strong>What happens next?</strong><br/>A calendar invite has been sent to your email. Please arrive 5 minutes before your scheduled time.</p>
      </div>
      <div style="text-align:center;margin:28px 0 0;">
        <a href="${site.url}" style="display:inline-block;background:#E8510A;color:#FFFFFF !important;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:13px 28px;border-radius:6px;">Visit Our Website</a>
      </div>`;

    sendEmail({
      to: booking.customer_email,
      toName: booking.customer_name,
      subject: `Booking Confirmed — ${serviceName} (${reference})`,
      html: buildBrandedEmailHtml(emailBody, `Your ${serviceName} booking is confirmed for ${formattedDate} at ${time}.`),
    }).then((r) => {
      if (!r.ok) console.error('booking/schedule: email failed:', r.error);
    });

    await dbQuery(
      `INSERT INTO email_logs (booking_reference, email_type, subject, recipient_email, status) VALUES (?, 'booking_confirmation', ?, ?, 'sent')`,
      [reference, `Booking Confirmed — ${serviceName} (${reference})`, booking.customer_email]
    );

    return Response.json({
      ok: true,
      booking: {
        reference,
        date,
        time,
        service: serviceName,
        duration,
        meetLink,
      },
    }, { status: 200 });
  } catch (err) {
    console.error('booking/schedule: error:', err);
    return Response.json({ ok: false, error: 'Internal server error.' }, { status: 500 });
  }
}

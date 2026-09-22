import { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { dbQuery } from '@/lib/db';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';
import { site } from '@/data/site';
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  try {
    await requireAdmin(request, 'read');
    
    const { reference } = await context.params;
    
    // Get booking with all related info
    const bookings = await dbQuery(
      `SELECT 
        b.*,
        s.name as service_name,
        s.description as service_description,
        s.duration_minutes,
        p.mpesa_receipt,
        p.mpesa_checkout_id,
        p.phone_number as payment_phone,
        p.status as payment_status,
        p.created_at as payment_date
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN payments p ON b.reference = p.booking_reference
      WHERE b.reference = ?`,
      [reference]
    );
    
    if (!bookings || (bookings as any[]).length === 0) {
      return Response.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    const booking = (bookings as any[])[0];
    
    // Get email logs for this booking
    const emailLogs = await dbQuery(
      `SELECT * FROM email_logs WHERE booking_reference = ? ORDER BY sent_at DESC`,
      [reference]
    );
    
    return Response.json({
      ok: true,
      booking: {
        ...booking,
        email_logs: emailLogs
      }
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load booking');
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  try {
    await requireAdmin(request, 'update');
    
    const { reference } = await context.params;
    const body = await request.json();
    
    const { cancel_reason, send_email, ...fields } = body;

    const allowedFields = ['status', 'booked_date', 'booked_time', 'notes'];
    const updates: string[] = [];
    const values: unknown[] = [];
    
    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(fields[field]);
      }
    }
    
    if (updates.length === 0 && !cancel_reason) {
      return Response.json(
        { ok: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    updates.push('updated_at = NOW()');
    values.push(reference);
    
    await dbQuery(
      `UPDATE bookings SET ${updates.join(', ')} WHERE reference = ?`,
      values
    );

    // If date/time changed, update the calendar event
    if ((fields.booked_date !== undefined || fields.booked_time !== undefined) && fields.status !== 'cancelled') {
      const rows = await dbQuery<Array<{
        google_event_id: string | null;
        customer_name: string;
        customer_email: string;
        customer_phone: string;
        booked_date: string;
        booked_time: string;
        service_name: string | null;
        duration_minutes: number;
        amount: number;
      }>>(
        `SELECT b.google_event_id, b.customer_name, b.customer_email, b.customer_phone,
                b.booked_date, b.booked_time, b.amount,
                s.name as service_name, s.duration_minutes
         FROM bookings b LEFT JOIN services s ON b.service_id = s.id
         WHERE b.reference = ?`,
        [reference]
      );
      const row = rows[0];

      if (row) {
        // Delete old calendar event
        if (row.google_event_id) {
          await deleteCalendarEvent(row.google_event_id);
        }

        const newDate = fields.booked_date ?? row.booked_date;
        const newTime = (fields.booked_time ?? row.booked_time).slice(0, 5);

        // Create new calendar event
        const calResult = await createCalendarEvent({
          summary: `${row.service_name} — ${row.customer_name}`,
          description: [
            `Service: ${row.service_name}`,
            `Client: ${row.customer_name}`,
            `Email: ${row.customer_email}`,
            `Phone: ${row.customer_phone}`,
            `Reference: ${reference}`,
            `Amount paid: KES ${Number(row.amount).toLocaleString()}`,
          ].join('\n'),
          startDate: newDate,
          startTime: newTime,
          durationMinutes: row.duration_minutes,
          attendeeEmail: row.customer_email,
          attendeeName: row.customer_name,
        });

        const meetLink = calResult.meetLink ?? process.env.GOOGLE_MEET_LINK ?? null;

        await dbQuery(
          `UPDATE bookings SET google_event_id = ?, meet_link = ? WHERE reference = ?`,
          [calResult.eventId, meetLink, reference]
        );
      }
    }

    // Handle cancellation: remove calendar event + send email
    if (fields.status === 'cancelled') {
      // Fetch booking details for calendar cleanup + email
      const rows = await dbQuery<Array<{ google_event_id: string | null; customer_name: string; customer_email: string; service_name: string | null; booked_date: string | null; booked_time: string | null }>>(
        `SELECT b.google_event_id, b.customer_name, b.customer_email, b.booked_date, b.booked_time, s.name as service_name
         FROM bookings b LEFT JOIN services s ON b.service_id = s.id
         WHERE b.reference = ?`,
        [reference]
      );
      const row = rows[0];

      // Delete Google Calendar event
      if (row?.google_event_id) {
        await deleteCalendarEvent(row.google_event_id);
        await dbQuery(`UPDATE bookings SET google_event_id = NULL, meet_link = NULL WHERE reference = ?`, [reference]);
      }

      // Append cancellation reason to notes
      if (cancel_reason) {
        const existingNotes = await dbQuery<Array<{ notes: string | null }>>(`SELECT notes FROM bookings WHERE reference = ?`, [reference]);
        const prev = existingNotes[0]?.notes ?? '';
        const stamp = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short' });
        const cancelNote = `[${stamp}] Cancellation reason: ${cancel_reason}`;
        await dbQuery(`UPDATE bookings SET notes = ? WHERE reference = ?`, [prev ? `${prev}\n\n${cancelNote}` : cancelNote, reference]);
      }

      // Send cancellation email to customer
      if (send_email && row?.customer_email) {
        const bodyHtml = `
          <h1>Booking Cancelled</h1>
          <p>Hi ${row.customer_name},</p>
          <p>Your booking <strong>${reference}</strong> for <strong>${row.service_name ?? 'your consultation'}</strong>
            ${row.booked_date ? ` on <strong>${row.booked_date}</strong>${row.booked_time ? ` at ${row.booked_time.slice(0, 5)}` : ''}` : ''}
            has been cancelled.
          </p>
          ${cancel_reason ? `<p><strong>Reason:</strong> ${cancel_reason}</p>` : ''}
          <p>If you believe this was done in error, please contact us at <a href="mailto:${site.email}">${site.email}</a> or call <strong>${site.phone}</strong>.</p>
          <p>We look forward to working with you in the future.</p>
        `;
        const emailResult = await sendEmail({
          to: row.customer_email,
          subject: `Booking Cancelled — ${reference} — ${site.name}`,
          html: buildBrandedEmailHtml(bodyHtml, `Your booking ${reference} has been cancelled`),
        });
        await dbQuery(
          `INSERT INTO email_logs (booking_reference, email_type, subject, recipient_email, status, error_message)
           VALUES (?, 'booking_cancellation', ?, ?, ?, ?)`,
          [reference, `Booking Cancelled — ${reference} — ${site.name}`, row.customer_email, emailResult.ok ? 'sent' : 'failed', emailResult.ok ? null : emailResult.error ?? 'Unknown error']
        );
      }
    }
    
    return Response.json({ ok: true, message: 'Booking updated successfully' });
  } catch (error) {
    return jsonAdminError(error, 'Failed to update booking');
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  try {
    await requireAdmin(request, 'delete');
    
    const { reference } = await context.params;
    
    // Check if booking exists
    const bookings = await dbQuery(
      `SELECT id, status FROM bookings WHERE reference = ?`,
      [reference]
    );
    
    if (!bookings || (bookings as any[]).length === 0) {
      return Response.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Soft delete - just cancel the booking
    await dbQuery(
      `UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE reference = ?`,
      [reference]
    );
    
    return Response.json({
      ok: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to cancel booking');
  }
}
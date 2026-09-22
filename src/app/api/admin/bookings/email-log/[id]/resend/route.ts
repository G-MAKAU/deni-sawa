import { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { dbQuery } from '@/lib/db';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';
import { site } from '@/data/site';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request, 'update');
    const { id } = await context.params;

    const body = await request.json().catch(() => ({}));
    const subjectOverride = typeof body.subject === 'string' ? body.subject : null;
    const htmlOverride = typeof body.html === 'string' ? body.html : null;

    const rows = await dbQuery<{ id: number; booking_reference: string; email_type: string; subject: string | null; recipient_email: string }[]>(
      'SELECT * FROM email_logs WHERE id = ?',
      [id]
    );
    const entry = rows[0];
    if (!entry) {
      return Response.json({ ok: false, error: 'Email log entry not found' }, { status: 404 });
    }

    const subject = subjectOverride || entry.subject || `[Resent] ${entry.email_type} — ${entry.booking_reference}`;
    const html = htmlOverride || buildBrandedEmailHtml(
      `<p>This is a resent email for booking <strong>${entry.booking_reference}</strong>.</p><p>Email type: ${entry.email_type}</p>`,
      `Email regarding booking ${entry.booking_reference}`
    );

    const result = await sendEmail({
      to: String(entry.recipient_email),
      subject: `[Resent] ${subject}`,
      html,
    });

    await dbQuery(
      'UPDATE email_logs SET status = ?, error_message = ?, sent_at = NOW() WHERE id = ?',
      [result.ok ? 'sent' : 'failed', result.error ?? null, id]
    );

    return Response.json({ ok: result.ok, error: result.error });
  } catch (error) {
    return jsonAdminError(error, 'Failed to resend booking email');
  }
}

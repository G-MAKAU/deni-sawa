import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, adminWriteClient, jsonAdminError } from '@/lib/admin-auth';
import { deliverReportByEmail } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ reportId: z.string().uuid() });

/** Resends the report email for a given report. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const context = await requireAdmin(request, 'read');
    const supabase = adminWriteClient(context);
    const { reportId } = paramsSchema.parse(await params);

    const { data: report } = await supabase.from('health_check_reports').select('id, session_id').eq('id', reportId).maybeSingle();
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

    const { data: session } = await supabase
      .from('health_check_sessions')
      .select('email, full_name')
      .eq('id', report.session_id)
      .maybeSingle();
    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    if (!session.email) return NextResponse.json({ error: 'Session has no email address.' }, { status: 422 });

    const result = await deliverReportByEmail(supabase, reportId);

    return NextResponse.json({
      ok: result.ok,
      error: result.error,
      to: session.email,
      recipientName: session.full_name,
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to resend report email');
  }
}

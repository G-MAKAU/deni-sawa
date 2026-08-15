import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/supabase/service';
import { runReportGeneration, type ReportType } from '@/lib/generate-report';
import { notifyReportFailed } from '@/lib/delivery';

export const maxDuration = 120;

const generateSchema = z.object({
  report_type: z.enum(['summary', 'detailed']).default('summary'),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
  }

  const supabase = getServiceClient();
  const { id: sessionId } = await params;
  const reportType = parsed.data.report_type as ReportType;

  // Load the session up-front so we can notify the user if generation fails.
  const { data: session, error: sessionError } = await supabase
    .from('health_check_sessions')
    .select('id, health_check_id, full_name, email, whatsapp, preferred_delivery, is_complete')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json({ error: 'Failed to load the session.' }, { status: 500 });
  }
  if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  if (!session.is_complete) {
    return NextResponse.json({ error: 'Session must be completed before generating a report.' }, { status: 422 });
  }

  try {
    const { report, regenerated } = await runReportGeneration(supabase, session, reportType);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://deni-sawa.com';
    return NextResponse.json({
      report_id: report.id,
      report_url_token: report.report_url_token,
      report_url: `${siteUrl}/health-checks/report/${report.report_url_token}`,
      report_type: reportType,
      regenerated,
    });
  } catch (error) {
    console.error('Failed to generate report:', error);
    // Notify the user that their report could not be generated.
    await notifyReportFailed(supabase, session);
    return NextResponse.json({ error: 'Failed to generate report.' }, { status: 500 });
  }
}

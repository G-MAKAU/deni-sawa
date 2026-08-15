import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/supabase/service';
import { deliverReportByWhatsApp } from '@/lib/delivery';

export const maxDuration = 60;

const bodySchema = z.object({ report_id: z.string().uuid() });

function isInternal(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return true; // No secret configured — trust the runtime boundary.
  return request.headers.get('x-internal-secret') === secret;
}

export async function POST(request: NextRequest) {
  if (!isInternal(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
  }

  const supabase = getServiceClient();
  const result = await deliverReportByWhatsApp(supabase, parsed.data.report_id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Delivery failed.' }, { status: 502 });
  }

  return NextResponse.json({ success: true, messageId: result.error ?? undefined });
}

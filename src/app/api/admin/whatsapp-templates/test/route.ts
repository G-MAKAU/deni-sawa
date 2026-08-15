import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { sendTemplatedWhatsApp, type WhatsAppTemplateRow } from '@/lib/whatsapp';
import { getServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const testSchema = z.object({
  template_key: z.string().min(1),
  send_to: z.string().min(6).max(32),
  variables: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
});

export async function POST(request: NextRequest) {
  try {
    const { currentAdmin } = await requireAdmin(request, 'create');

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = testSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const supabase = getServiceClient();
    const { data: template, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('template_key', parsed.data.template_key)
      .maybeSingle();

    if (error) throw error;
    if (!template) return NextResponse.json({ error: 'WhatsApp template not found' }, { status: 404 });

    const result = await sendTemplatedWhatsApp(supabase, {
      template: template as unknown as WhatsAppTemplateRow,
      to: parsed.data.send_to,
      toName: parsed.data.send_to,
      variables: parsed.data.variables,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? 'Failed to send test message.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    return jsonAdminError(error, 'Failed to send test WhatsApp message');
  }
}

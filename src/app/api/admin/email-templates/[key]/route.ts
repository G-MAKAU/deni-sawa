import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { lexicalToHtml } from '@/lib/lexical-to-html';
import { buildBrandedEmailHtml } from '@/lib/email';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ key: z.string().min(1) });

const updateSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(300),
  preview_text: z.string().max(200).nullable().optional(),
  body_lexical: z.record(z.string(), z.unknown()),
  from_name: z.string().min(1).max(200).optional(),
  from_email: z.string().email().optional(),
  reply_to: z.string().email().nullable().optional(),
  is_active: z.boolean().optional(),
  available_variables: z.array(z.string()).max(40).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'read');
    const { key } = paramsSchema.parse(await params);

    const { data, error } = await supabase
      .from('email_templates')
      .select('*, updated_by_admin:admin_users(full_name)')
      .eq('template_key', key)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Email template not found' }, { status: 404 });

    const updater = Array.isArray(data.updated_by_admin) ? data.updated_by_admin[0] : data.updated_by_admin;
    return NextResponse.json({ template: { ...data, updated_by_name: (updater as { full_name?: string } | undefined)?.full_name ?? null } });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load email template');
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { supabase, currentAdmin } = await requireAdmin(request, 'update');
    const { key } = paramsSchema.parse(await params);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    // Lexical → HTML → branded wrapper (regenerated on every save).
    const rawHtml = lexicalToHtml(parsed.data.body_lexical);
    const bodyHtml = buildBrandedEmailHtml(rawHtml);

    const { data, error } = await supabase
      .from('email_templates')
      .update({
        name: parsed.data.name,
        subject: parsed.data.subject,
        preview_text: parsed.data.preview_text,
        body_lexical: parsed.data.body_lexical,
        body_html: bodyHtml,
        from_name: parsed.data.from_name ?? 'Deni Sawa Partners',
        from_email: parsed.data.from_email ?? 'noreply@deni-sawa.com',
        reply_to: parsed.data.reply_to ?? null,
        is_active: parsed.data.is_active ?? true,
        ...(parsed.data.available_variables ? { available_variables: parsed.data.available_variables } : {}),
        updated_by: currentAdmin.id,
      })
      .eq('template_key', key)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ template: { ...data, updated_by_name: currentAdmin.full_name } });
  } catch (error) {
    return jsonAdminError(error, 'Failed to save email template');
  }
}

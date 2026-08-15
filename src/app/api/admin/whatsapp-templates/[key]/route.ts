import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ key: z.string().min(1) });

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  body_text: z.string().min(1).max(1024).optional(),
  available_variables: z.array(z.string()).max(40).optional(),
  wa_template_id: z.string().max(120).nullable().optional(),
  is_active: z.boolean().optional(),
  action: z.enum(['save', 'submit', 'toggle_active', 'set_wa_id']).default('save'),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'read');
    const { key } = paramsSchema.parse(await params);

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*, updated_by_admin:admin_users(full_name)')
      .eq('template_key', key)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'WhatsApp template not found' }, { status: 404 });

    const updater = Array.isArray(data.updated_by_admin) ? data.updated_by_admin[0] : data.updated_by_admin;
    return NextResponse.json({ template: { ...data, updated_by_name: (updater as { full_name?: string } | undefined)?.full_name ?? null } });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load WhatsApp template');
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

    const { data: current, error: fetchError } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('template_key', key)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!current) return NextResponse.json({ error: 'WhatsApp template not found' }, { status: 404 });

    const status = current.approval_status as 'draft' | 'submitted' | 'approved' | 'rejected';
    let payload: Record<string, unknown> = { updated_by: currentAdmin.id };

    switch (parsed.data.action) {
      case 'submit': {
        if (status !== 'draft' && status !== 'rejected') {
          return NextResponse.json({ error: 'Only draft or rejected templates can be submitted for approval.' }, { status: 422 });
        }
        if (!current.body_text?.trim()) {
          return NextResponse.json({ error: 'The message body is required before submission.' }, { status: 422 });
        }
        payload.approval_status = 'submitted';
        payload.rejection_reason = null;
        break;
      }
      case 'toggle_active': {
        if (status !== 'approved') {
          return NextResponse.json({ error: 'A template must be approved before it can be activated.' }, { status: 422 });
        }
        if (parsed.data.is_active === undefined) {
          return NextResponse.json({ error: 'is_active is required for this action.' }, { status: 422 });
        }
        payload.is_active = parsed.data.is_active;
        break;
      }
      case 'set_wa_id': {
        payload.wa_template_id = parsed.data.wa_template_id ?? null;
        break;
      }
      case 'save':
      default: {
        // Editing is locked while a submission is in review.
        if (status === 'submitted') {
          return NextResponse.json({ error: 'Editing is locked while the template is submitted for approval.' }, { status: 422 });
        }
        if (status === 'approved') {
          return NextResponse.json({ error: 'Approved templates can only have their activation toggled.' }, { status: 422 });
        }
        if (parsed.data.name !== undefined) payload.name = parsed.data.name;
        if (parsed.data.body_text !== undefined) payload.body_text = parsed.data.body_text;
        if (parsed.data.available_variables !== undefined) payload.available_variables = parsed.data.available_variables;
        // A rejected template returns to draft once edited.
        if (status === 'rejected') {
          payload.approval_status = 'draft';
          payload.rejection_reason = null;
        }
      }
    }

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .update(payload)
      .eq('template_key', key)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ template: { ...data, updated_by_name: currentAdmin.full_name } });
  } catch (error) {
    return jsonAdminError(error, 'Failed to update WhatsApp template');
  }
}

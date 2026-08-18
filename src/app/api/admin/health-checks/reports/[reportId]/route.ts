import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError, AdminApiError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ reportId: z.string().uuid() });

// Editable fields: payment status (restricted to super_admin/admin) and the
// report content itself (lexical_state), which any editor may change.
const paidSchema = z.object({ is_paid: z.boolean() });
const contentSchema = z.object({
  lexical_state: z.record(z.string(), z.unknown()),
  updated_by: z.string().uuid().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'read');
    const { reportId } = paramsSchema.parse(await params);

    const { data, error } = await supabase
      .from('health_check_reports')
      .select('*, session:health_check_sessions(*, health_checks(name, slug))')
      .eq('id', reportId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    // Flatten the nested session + check into convenient display fields.
    const session = Array.isArray(data.session) ? data.session[0] : data.session;
    const check = (session as { health_checks?: { name?: string; slug?: string } | { name?: string; slug?: string }[] } | null)?.health_checks;
    const checkRow = Array.isArray(check) ? check[0] : check;
    return NextResponse.json({
      report: {
        ...data,
        session_name: (session as { full_name?: string } | null)?.full_name ?? '—',
        business_name: (session as { business_name?: string | null } | null)?.business_name ?? null,
        check_name: (checkRow as { name?: string } | undefined)?.name ?? 'Health Check',
        check_slug: (checkRow as { slug?: string } | undefined)?.slug ?? '',
      },
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load report');
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { supabase, currentAdmin } = await requireAdmin(request, 'update');
    const { reportId } = paramsSchema.parse(await params);

    // Paid toggle restricted to super_admin + admin.
    if (currentAdmin.role !== 'super_admin' && currentAdmin.role !== 'admin') {
      throw new AdminApiError('Only super admins and admins can toggle report payment status.', 403);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Content edits (report body) are allowed for any role with update access.
    const content = contentSchema.safeParse(body);
    if (content.success) {
      const { data, error } = await supabase
        .from('health_check_reports')
        .update({ lexical_state: content.data.lexical_state, edited_by: content.data.updated_by ?? currentAdmin.id, edited_at: new Date().toISOString() })
        .eq('id', reportId)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ report: data });
    }

    // Paid toggle restricted to super_admin + admin.
    if (currentAdmin.role !== 'super_admin' && currentAdmin.role !== 'admin') {
      throw new AdminApiError('Only super admins and admins can toggle report payment status.', 403);
    }

    const parsed = paidSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const { data, error } = await supabase
      .from('health_check_reports')
      .update({ is_paid: parsed.data.is_paid })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ report: data });
  } catch (error) {
    return jsonAdminError(error, 'Failed to update report');
  }
}

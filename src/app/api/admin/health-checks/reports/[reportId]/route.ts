import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError, AdminApiError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ reportId: z.string().uuid() });

const paidSchema = z.object({ is_paid: z.boolean() });

export async function GET(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'read');
    const { reportId } = paramsSchema.parse(await params);

    const { data, error } = await supabase
      .from('health_check_reports')
      .select('*, session:health_check_sessions(*, health_checks(name))')
      .eq('id', reportId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    return NextResponse.json({ report: data });
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

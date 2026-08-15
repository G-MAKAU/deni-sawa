import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request, 'read');

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ templates: data ?? [] });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load email templates');
  }
}

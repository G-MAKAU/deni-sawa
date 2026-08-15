import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const BUCKET = 'deni_sawa';

const renameSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

function normalizePath(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request, 'update');

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = renameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const from = normalizePath(parsed.data.from);
    const to = normalizePath(parsed.data.to);

    if (from === to) {
      return NextResponse.json({ error: 'The new name is the same as the current one.' }, { status: 422 });
    }

    const { error } = await supabase.storage.from(BUCKET).move(from, to);

    if (error) {
      if ((error as { message?: string }).message?.includes('already exists')) {
        return NextResponse.json({ error: 'A file with that name already exists.' }, { status: 409 });
      }
      if ((error as { message?: string }).message?.includes('not found')) {
        return NextResponse.json({ error: 'The file could not be found.' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      path: to,
      publicUrl: supabase.storage.from(BUCKET).getPublicUrl(to).data.publicUrl,
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to rename file');
  }
}

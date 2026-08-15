import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { loadQuestionTree, buildQuestionsPdf, buildQuestionsWordBuffer } from '@/lib/export-questions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const paramsSchema = z.object({ id: z.string().uuid() });

/** Exports the health check question bank as a numbered PDF or Word document. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'read');
    const { id } = paramsSchema.parse(await params);
    const format = (request.nextUrl.searchParams.get('format') ?? 'pdf') as 'pdf' | 'word';

    const { data: check } = await supabase
      .from('health_checks')
      .select('name, slug, description')
      .eq('id', id)
      .maybeSingle();
    if (!check) return NextResponse.json({ error: 'Health check not found.' }, { status: 404 });

    const { sections } = await loadQuestionTree(supabase, id);
    const title = `${check.name} — Questions`;

    if (format === 'word') {
      const buffer = await buildQuestionsWordBuffer(title, check.description, sections);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${check.slug}-questions.docx"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    const buffer = await buildQuestionsPdf(title, check.description, sections);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${check.slug}-questions.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to export questions');
  }
}

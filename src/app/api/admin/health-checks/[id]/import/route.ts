import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const checkParamsSchema = z.object({ id: z.string().uuid() });

/* ------------------------------------------------------------------ */
/*  JSON import schema                                                 */
/* ------------------------------------------------------------------ */

const importQuestionSchema = z.object({
  text: z.string().min(1).max(2000),
  type: z.enum(['paragraph', 'single_select', 'multi_select']).optional().default('paragraph'),
  required: z.boolean().optional().default(true),
  helper_text: z.string().max(500).optional().nullable(),
  options: z.array(z.string().min(1).max(500)).max(30).optional(),
});

const importSubsectionSchema = z.object({
  heading: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  questions: z.array(importQuestionSchema).min(1),
});

const importSectionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  subsections: z.array(importSubsectionSchema).min(1),
});

const jsonImportSchema = z.object({
  sections: z.array(importSectionSchema).min(1),
});

/* ------------------------------------------------------------------ */
/*  Plain-text parser                                                  */
/* ------------------------------------------------------------------ */

interface ParsedQuestion {
  text: string;
  type: 'paragraph' | 'single_select' | 'multi_select';
  required: boolean;
  helper_text: string | null;
  options: string[];
}

interface ParsedSubsection {
  heading: string;
  description: string | null;
  questions: ParsedQuestion[];
}

interface ParsedSection {
  title: string;
  description: string | null;
  subsections: ParsedSubsection[];
}

function parseTextImport(raw: string): ParsedSection[] {
  const lines = raw.split('\n');
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;
  let currentSubsection: ParsedSubsection | null = null;
  let currentQuestion: ParsedQuestion | null = null;

  const flushQuestion = () => {
    if (currentQuestion) {
      if (currentQuestion.text.trim()) {
        currentSubsection?.questions.push(currentQuestion);
      }
      currentQuestion = null;
    }
  };

  const flushSubsection = () => {
    flushQuestion();
    if (currentSubsection) {
      if (currentSubsection.questions.length > 0) {
        currentSection?.subsections.push(currentSubsection);
      }
      currentSubsection = null;
    }
  };

  const flushSection = () => {
    flushSubsection();
    if (currentSection) {
      if (currentSection.subsections.length > 0) {
        sections.push(currentSection);
      }
      currentSection = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Section: ## Title
    const sectionMatch = trimmed.match(/^##\s+(.+)/);
    if (sectionMatch) {
      flushSection();
      currentSection = { title: sectionMatch[1].trim(), description: null, subsections: [] };
      currentSubsection = null;
      currentQuestion = null;
      continue;
    }

    // Subsection: ### Title
    const subsectionMatch = trimmed.match(/^###\s+(.+)/);
    if (subsectionMatch) {
      flushSubsection();
      if (!currentSection) {
        currentSection = { title: 'Imported Questions', description: null, subsections: [] };
      }
      currentSubsection = { heading: subsectionMatch[1].trim(), description: null, questions: [] };
      currentQuestion = null;
      continue;
    }

    // Type prefixes
    const radioMatch = trimmed.match(/^\[radio\]\s*(.+)/i);
    const checkboxMatch = trimmed.match(/^\[checkbox\]\s*(.+)/i);
    const textMatch = trimmed.match(/^\[text\]\s*(.+)/i);

    if (radioMatch || checkboxMatch || textMatch) {
      flushQuestion();
      if (!currentSection) {
        currentSection = { title: 'Imported Questions', description: null, subsections: [] };
      }
      if (!currentSubsection) {
        currentSubsection = { heading: 'General', description: null, questions: [] };
        currentSection.subsections.push(currentSubsection);
      }

      const type = radioMatch ? 'single_select' : checkboxMatch ? 'multi_select' : 'paragraph';
      currentQuestion = {
        text: (radioMatch?.[1] ?? checkboxMatch?.[1] ?? textMatch?.[1] ?? '').trim(),
        type,
        required: true,
        helper_text: null,
        options: [],
      };
      continue;
    }

    // Option: - Option text (indented or under a select question)
    const optionMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (optionMatch && currentQuestion && (currentQuestion.type === 'single_select' || currentQuestion.type === 'multi_select')) {
      currentQuestion.options.push(optionMatch[1].trim());
      continue;
    }

    // Plain text question (no prefix, not an option)
    if (currentQuestion && (currentQuestion.type === 'single_select' || currentQuestion.type === 'multi_select') && currentQuestion.options.length > 0) {
      // Previous question was a select with options, this is a new question
      flushQuestion();
    }

    if (!currentSection) {
      currentSection = { title: 'Imported Questions', description: null, subsections: [] };
    }
    if (!currentSubsection) {
      currentSubsection = { heading: 'General', description: null, questions: [] };
      currentSection.subsections.push(currentSubsection);
    }

    // If we have a current paragraph question with no text yet, this is continuation
    if (currentQuestion && currentQuestion.type === 'paragraph' && !currentQuestion.text) {
      currentQuestion.text = trimmed;
    } else {
      flushQuestion();
      currentQuestion = {
        text: trimmed,
        type: 'paragraph',
        required: true,
        helper_text: null,
        options: [],
      };
    }
  }

  flushSection();
  return sections;
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/health-checks/[id]/import                          */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'create');
    const { id } = checkParamsSchema.parse(await params);

    let body: { mode?: string; content?: string; preview?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const mode = body.mode ?? 'json';
    const content = body.content ?? '';
    const preview = body.preview ?? false;

    if (!content.trim()) {
      return NextResponse.json({ error: 'No content to import.' }, { status: 400 });
    }

    let sections: ParsedSection[];

    if (mode === 'json') {
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        return NextResponse.json({ error: 'Invalid JSON. Please check the format.' }, { status: 400 });
      }
      const result = jsonImportSchema.safeParse(parsed);
      if (!result.success) {
        return NextResponse.json({ error: 'Invalid structure', details: result.error.flatten() }, { status: 422 });
      }
      sections = result.data.sections.map((s) => ({
        title: s.title,
        description: s.description ?? null,
        subsections: s.subsections.map((sub) => ({
          heading: sub.heading,
          description: sub.description ?? null,
          questions: sub.questions.map((q) => ({
            text: q.text,
            type: q.type,
            required: q.required,
            helper_text: q.helper_text ?? null,
            options: q.options ?? [],
          })),
        })),
      }));
    } else {
      sections = parseTextImport(content);
    }

    if (sections.length === 0) {
      return NextResponse.json({ error: 'No sections or questions found in the content.' }, { status: 422 });
    }

    // Count totals.
    let totalQuestions = 0;
    let totalOptions = 0;
    for (const section of sections) {
      for (const sub of section.subsections) {
        totalQuestions += sub.questions.length;
        for (const q of sub.questions) {
          totalOptions += q.options.length;
        }
      }
    }

    // Preview mode: return the parsed structure without inserting.
    if (preview) {
      return NextResponse.json({
        preview: true,
        sections: sections.map((s) => ({
          title: s.title,
          description: s.description,
          subsections: s.subsections.map((sub) => ({
            heading: sub.heading,
            description: sub.description,
            questions: sub.questions.map((q) => ({
              text: q.text,
              type: q.type,
              required: q.required,
              helper_text: q.helper_text,
              options: q.options,
            })),
          })),
        })),
        totals: { sections: sections.length, questions: totalQuestions, options: totalOptions },
      });
    }

    // Actual import.
    const { count: sectionCount } = await supabase
      .from('health_check_sections')
      .select('id', { count: 'exact', head: true })
      .eq('health_check_id', id);
    let sectionSort = (sectionCount ?? 0) + 1;

    for (const section of sections) {
      const { data: sectionRow, error: sectionErr } = await supabase
        .from('health_check_sections')
        .insert({ health_check_id: id, title: section.title, description: section.description, sort_order: sectionSort++ })
        .select('id')
        .single();
      if (sectionErr) throw sectionErr;

      for (let subIdx = 0; subIdx < section.subsections.length; subIdx++) {
        const sub = section.subsections[subIdx];
        const { data: subRow, error: subErr } = await supabase
          .from('health_check_subsections')
          .insert({ section_id: sectionRow.id, heading: sub.heading, description: sub.description, sort_order: subIdx + 1 })
          .select('id')
          .single();
        if (subErr) throw subErr;

        const { count: qCount } = await supabase
          .from('health_check_questions')
          .select('id', { count: 'exact', head: true })
          .eq('subsection_id', subRow.id);
        let qSort = (qCount ?? 0) + 1;

        for (const question of sub.questions) {
          const { data: qRow, error: qErr } = await supabase
            .from('health_check_questions')
            .insert({
              subsection_id: subRow.id,
              question_text: question.text,
              question_type: question.type,
              is_required: question.required,
              helper_text: question.helper_text,
              sort_order: qSort++,
            })
            .select('id')
            .single();
          if (qErr) throw qErr;

          if (question.options.length > 0 && (question.type === 'single_select' || question.type === 'multi_select')) {
            const { error: optErr } = await supabase
              .from('health_check_question_options')
              .insert(question.options.map((optText, i) => ({ question_id: qRow.id, option_text: optText, sort_order: i + 1 })));
            if (optErr) throw optErr;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported: { sections: sections.length, questions: totalQuestions, options: totalOptions },
    }, { status: 201 });
  } catch (error) {
    return jsonAdminError(error, 'Failed to import questions');
  }
}

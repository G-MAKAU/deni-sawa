import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const checkParamsSchema = z.object({ id: z.string().uuid() });

/* ------------------------------------------------------------------ */
/*  Max limits                                                         */
/* ------------------------------------------------------------------ */

const MAX_SECTIONS = 25;
const MAX_QUESTIONS = 500;
const MAX_OPTIONS = 1500;

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
  // Tracks whether the most recent heading was a section or subsection,
  // so description lines can be routed correctly.
  let lastHeadingType: 'section' | 'subsection' | null = null;

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
      lastHeadingType = 'section';
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
      lastHeadingType = 'subsection';
      continue;
    }

    // Helper text: > text (attached to current question)
    const helperMatch = trimmed.match(/^>\s*(.+)/);
    if (helperMatch && currentQuestion) {
      currentQuestion.helper_text = helperMatch[1].trim();
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
      lastHeadingType = null;
      continue;
    }

    // Option: - Option text (only under a select question)
    const optionMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (optionMatch && currentQuestion && (currentQuestion.type === 'single_select' || currentQuestion.type === 'multi_select')) {
      currentQuestion.options.push(optionMatch[1].trim());
      continue;
    }

    // Description line: after a heading, before any question
    if (lastHeadingType && !currentQuestion) {
      const descText = trimmed;
      if (lastHeadingType === 'section' && currentSection && !currentSubsection) {
        currentSection.description = currentSection.description
          ? `${currentSection.description}\n${descText}`
          : descText;
        continue;
      }
      if (lastHeadingType === 'subsection' && currentSubsection) {
        currentSubsection.description = currentSubsection.description
          ? `${currentSubsection.description}\n${descText}`
          : descText;
        continue;
      }
    }

    // Plain text question (no prefix, not an option)
    if (currentQuestion && (currentQuestion.type === 'single_select' || currentQuestion.type === 'multi_select') && currentQuestion.options.length > 0) {
      flushQuestion();
    }

    if (!currentSection) {
      currentSection = { title: 'Imported Questions', description: null, subsections: [] };
    }
    if (!currentSubsection) {
      currentSubsection = { heading: 'General', description: null, questions: [] };
      currentSection.subsections.push(currentSubsection);
    }

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
    lastHeadingType = null;
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

    let body: { mode?: string; content?: string; preview?: boolean; selectedSections?: string[] } = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const mode = body.mode ?? 'json';
    const content = body.content ?? '';
    const preview = body.preview ?? false;
    const selectedSections = body.selectedSections;

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

    // Filter to selected sections if provided (partial import).
    if (selectedSections && selectedSections.length > 0) {
      const selected = new Set(selectedSections.map((s) => s.toLowerCase()));
      sections = sections.filter((s) => selected.has(s.title.toLowerCase()));
      if (sections.length === 0) {
        return NextResponse.json({ error: 'None of the selected sections were found in the content.' }, { status: 422 });
      }
    }

    // Count totals and enforce limits.
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

    if (sections.length > MAX_SECTIONS) {
      return NextResponse.json({ error: `Too many sections (${sections.length}). Maximum is ${MAX_SECTIONS}.` }, { status: 422 });
    }
    if (totalQuestions > MAX_QUESTIONS) {
      return NextResponse.json({ error: `Too many questions (${totalQuestions}). Maximum is ${MAX_QUESTIONS}.` }, { status: 422 });
    }
    if (totalOptions > MAX_OPTIONS) {
      return NextResponse.json({ error: `Too many options (${totalOptions}). Maximum is ${MAX_OPTIONS}.` }, { status: 422 });
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

    // ── Deduplication: fetch existing section titles ────────────────────
    const { data: existingSections } = await supabase
      .from('health_check_sections')
      .select('id, title')
      .eq('health_check_id', id);
    const existingTitles = new Set((existingSections ?? []).map((s) => (s.title as string).toLowerCase()));

    // Skip duplicate sections.
    const nonDuplicate = sections.filter((s) => !existingTitles.has(s.title.toLowerCase()));
    const skipped = sections.length - nonDuplicate.length;

    if (nonDuplicate.length === 0) {
      return NextResponse.json({
        success: true,
        imported: { sections: 0, questions: 0, options: 0 },
        skipped,
        message: `All ${skipped} section(s) already exist. Nothing new to import.`,
      }, { status: 200 });
    }

    // ── Insert with rollback tracking ──────────────────────────────────
    const insertedSectionIds: string[] = [];
    const insertedSubsectionIds: string[] = [];
    const insertedQuestionIds: string[] = [];

    try {
      const { count: sectionCount } = await supabase
        .from('health_check_sections')
        .select('id', { count: 'exact', head: true })
        .eq('health_check_id', id);
      let sectionSort = (sectionCount ?? 0) + 1;

      for (const section of nonDuplicate) {
        const { data: sectionRow, error: sectionErr } = await supabase
          .from('health_check_sections')
          .insert({ health_check_id: id, title: section.title, description: section.description, sort_order: sectionSort++ })
          .select('id')
          .single();
        if (sectionErr) throw sectionErr;
        insertedSectionIds.push(sectionRow.id);

        for (let subIdx = 0; subIdx < section.subsections.length; subIdx++) {
          const sub = section.subsections[subIdx];
          const { data: subRow, error: subErr } = await supabase
            .from('health_check_subsections')
            .insert({ section_id: sectionRow.id, heading: sub.heading, description: sub.description, sort_order: subIdx + 1 })
            .select('id')
            .single();
          if (subErr) throw subErr;
          insertedSubsectionIds.push(subRow.id);

          let qSort = 1;
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
            insertedQuestionIds.push(qRow.id);

            if (question.options.length > 0 && (question.type === 'single_select' || question.type === 'multi_select')) {
              const { error: optErr } = await supabase
                .from('health_check_question_options')
                .insert(question.options.map((optText, i) => ({ question_id: qRow.id, option_text: optText, sort_order: i + 1 })));
              if (optErr) throw optErr;
            }
          }
        }
      }
    } catch (insertError) {
      // Rollback: delete everything we just inserted (newest first).
      console.error('Import failed, rolling back...', insertError);
      if (insertedQuestionIds.length > 0) {
        await supabase.from('health_check_question_options').delete().in('question_id', insertedQuestionIds);
        await supabase.from('health_check_questions').delete().in('id', insertedQuestionIds);
      }
      if (insertedSubsectionIds.length > 0) {
        await supabase.from('health_check_subsections').delete().in('id', insertedSubsectionIds);
      }
      if (insertedSectionIds.length > 0) {
        await supabase.from('health_check_sections').delete().in('id', insertedSectionIds);
      }
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      imported: { sections: nonDuplicate.length, questions: totalQuestions, options: totalOptions },
      skipped,
    }, { status: 201 });
  } catch (error) {
    return jsonAdminError(error, 'Failed to import questions');
  }
}

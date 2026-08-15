import PDFDocument from 'pdfkit';
import { Document as DocxDocument, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ExportOption {
  id: string;
  option_text: string;
  sort_order: number;
}

export interface ExportQuestion {
  id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  helper_text: string | null;
  options: ExportOption[];
}

export interface ExportSubsection {
  id: string;
  heading: string;
  description: string | null;
  questions: ExportQuestion[];
}

export interface ExportSection {
  id: string;
  title: string;
  description: string | null;
  subsections: ExportSubsection[];
}

/** Loads the full question tree for a health check (no answers). */
export async function loadQuestionTree(
  supabase: SupabaseClient,
  checkId: string
): Promise<{ sections: ExportSection[] }> {
  const { data: sections } = await supabase
    .from('health_check_sections')
    .select('id, title, description, sort_order')
    .eq('health_check_id', checkId)
    .order('sort_order', { ascending: true });

  const sectionIds = (sections ?? []).map((s) => s.id);
  const { data: subsections } = await supabase
    .from('health_check_subsections')
    .select('id, section_id, heading, description, sort_order')
    .in('section_id', sectionIds)
    .order('sort_order', { ascending: true });

  const subsectionIds = (subsections ?? []).map((s) => s.id);
  const { data: questions } = await supabase
    .from('health_check_questions')
    .select('id, subsection_id, question_text, question_type, is_required, helper_text, sort_order')
    .in('subsection_id', subsectionIds)
    .order('sort_order', { ascending: true });

  const questionIds = (questions ?? []).map((q) => q.id);
  const { data: options } = await supabase
    .from('health_check_question_options')
    .select('id, question_id, option_text, sort_order')
    .in('question_id', questionIds)
    .order('sort_order', { ascending: true });

  const tree: ExportSection[] = (sections ?? []).map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    subsections: (subsections ?? [])
      .filter((sub) => sub.section_id === section.id)
      .map((sub) => ({
        id: sub.id,
        heading: sub.heading,
        description: sub.description,
        questions: (questions ?? [])
          .filter((q) => q.subsection_id === sub.id)
          .map((q) => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            is_required: q.is_required,
            helper_text: q.helper_text,
            options: (options ?? []).filter((o) => o.question_id === q.id),
          })),
      })),
  }));

  return { sections: tree };
}

/* ── PDF (via pdfkit — pure JS, bundles reliably in Next.js) ───────────── */

const BRAND = '#E8510A';
const INK = '#111111';
const MUTED = '#555555';
const HINT = '#7A5A00';

/** Renders the health check question bank to a PDF buffer. */
export function buildQuestionsPdf(
  title: string,
  description: string | null,
  sections: ExportSection[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 48, bottom: 48, left: 48, right: 48 },
      info: { Title: title, Author: 'Deni Sawa Partners', Subject: 'Health Check questions' },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const width = doc.page.width - left - doc.page.margins.right;

    // ── Header ──────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(20).fillColor(INK).text(title, { lineGap: 2 });
    doc.moveDown(0.2);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(MUTED)
      .text(`Confidential assessment · ${sections.length} sections · For Entrepreneurs, Founders, SMEs & Business Owners`, {
        lineGap: 2,
      });
    if (description) {
      doc.moveDown(0.3);
      doc.font('Helvetica-Oblique').fontSize(9.5).fillColor('#444444').text(description, { lineGap: 2 });
    }
    doc.moveDown(0.8);

    // ── Sections ────────────────────────────────────────────────────────
    let counter = 0;

    sections.forEach((section) => {
      doc.font('Helvetica-Bold').fontSize(13).fillColor(INK).text(section.title, { lineGap: 2 });
      // Brand underline under the section heading.
      const lineY = doc.y + 3;
      doc.moveTo(left, lineY).lineTo(left + width, lineY).lineWidth(1).strokeColor(BRAND).stroke();
      doc.moveDown(0.5);

      if (section.description) {
        doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(section.description, { lineGap: 2 });
        doc.moveDown(0.2);
      }

      section.subsections.forEach((sub) => {
        if (sub.heading && sub.heading !== section.title) {
          doc.font('Helvetica-Bold').fontSize(11).fillColor('#333333').text(sub.heading, { lineGap: 2 });
          doc.moveDown(0.1);
        }
        if (sub.description) {
          doc.font('Helvetica').fontSize(9).fillColor('#666666').text(sub.description, { lineGap: 2 });
          doc.moveDown(0.1);
        }

        sub.questions.forEach((q) => {
          counter += 1;
          doc.moveDown(0.3);
          doc
            .font('Helvetica-Bold')
            .fontSize(10)
            .fillColor(INK)
            .text(`Q${counter}. ${q.question_text}${q.is_required ? ' *' : ''}`, { lineGap: 2 });
          doc.moveDown(0.05);
          if (q.helper_text) {
            doc.font('Helvetica-Oblique').fontSize(9).fillColor(HINT).text(q.helper_text, { lineGap: 2 });
            doc.moveDown(0.05);
          }
          doc.font('Helvetica').fontSize(9).fillColor('#444444');
          q.options.forEach((o) => {
            doc.text(`• ${o.option_text}`, { indent: 12, lineGap: 1 });
          });
          doc.moveDown(0.1);
        });
      });
    });

    doc.moveDown(0.6);
    doc.font('Helvetica').fontSize(9).fillColor(BRAND).text('* Required question.');

    doc.end();
  });
}

/* ── Word (via docx) ───────────────────────────────────────────────────── */

function buildQuestionsWord(title: string, description: string | null, sections: ExportSection[]) {
  let counter = 0;
  const children: Paragraph[] = [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE, spacing: { after: 60 } }),
    new Paragraph({
      text: `Confidential assessment · ${sections.length} sections · For Entrepreneurs, Founders, SMEs & Business Owners`,
      style: 'Subtitle',
      spacing: { after: 120 },
    }),
  ];

  if (description) {
    children.push(
      new Paragraph({
        style: 'Subtitle',
        spacing: { after: 200 },
        children: [new TextRun({ text: description, italics: true })],
      })
    );
  }

  sections.forEach((section) => {
    children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }));
    if (section.description) {
      children.push(
        new Paragraph({
          style: 'Subtitle',
          spacing: { after: 80 },
          children: [new TextRun({ text: section.description, italics: true })],
        })
      );
    }
    section.subsections.forEach((sub) => {
      if (sub.heading && sub.heading !== section.title) {
        children.push(new Paragraph({ text: sub.heading, heading: HeadingLevel.HEADING_2 }));
      }
      if (sub.description) {
        children.push(
          new Paragraph({
            style: 'Subtitle',
            spacing: { after: 60 },
            children: [new TextRun({ text: sub.description, italics: true })],
          })
        );
      }
      sub.questions.forEach((q) => {
        counter += 1;
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 40 },
            children: [
              new TextRun({ text: `Q${counter}. `, bold: true }),
              new TextRun({ text: q.question_text, bold: true }),
              q.is_required ? new TextRun({ text: ' *', bold: true }) : undefined,
            ].filter(Boolean) as TextRun[],
          })
        );
        if (q.helper_text) {
          children.push(
            new Paragraph({
              indent: { left: 360 },
              children: [new TextRun({ text: q.helper_text, color: '7A5A00', size: 18, italics: true })],
            })
          );
        }
        q.options.forEach((o) => {
          children.push(
            new Paragraph({
              indent: { left: 720 },
              spacing: { after: 20 },
              children: [new TextRun({ text: `• ${o.option_text}`, size: 20 })],
            })
          );
        });
      });
    });
  });

  return new DocxDocument({
    creator: 'Deni Sawa Partners',
    title,
    description: 'Health Check questions',
    styles: {
      default: { document: { run: { font: 'Calibri', size: 20, color: '1A1A1A' } } },
      paragraphStyles: [
        {
          id: 'Subtitle',
          name: 'Subtitle',
          basedOn: 'Normal',
          next: 'Normal',
          run: { color: '666666', size: 18 },
        },
      ],
    },
    sections: [{ children }],
  });
}

export async function buildQuestionsWordBuffer(
  title: string,
  description: string | null,
  sections: ExportSection[]
): Promise<Buffer> {
  return Packer.toBuffer(buildQuestionsWord(title, description, sections));
}

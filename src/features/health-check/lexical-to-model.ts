import type { CheckType } from './types';
import { cssColorToHex, parseCssProperty } from '@/lib/css-color';

export interface ReportTextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface ReportTableCell {
  runs: ReportTextRun[];
  text: string;
  header: boolean;
  backgroundColor?: string;
}

export interface ReportTableRow {
  cells: ReportTableCell[];
}

export interface ReportBlock {
  kind: 'heading' | 'paragraph' | 'quote' | 'callout' | 'list' | 'divider' | 'table';
  level?: 1 | 2 | 3;
  text?: string;
  runs?: ReportTextRun[];
  items?: string[];
  listType?: 'bullet' | 'number' | 'check';
  checked?: boolean[];
  tone?: 'brand' | 'growth' | 'dark';
  color?: string;
  backgroundColor?: string;
  rows?: ReportTableRow[];
}

export interface ExportModel {
  checkType: CheckType;
  title: string;
  blocks: ReportBlock[];
}

const BOLD_MASK = 1;
const ITALIC_MASK = 2;
const UNDERLINE_MASK = 4;
const STRIKETHROUGH_MASK = 8;

/**
 * PDF-safe text. react-pdf's built-in fonts (Helvetica/Times/Courier) encode
 * WinAnsi (cp1252) only — glyphs like ✓, ✅, █ and emoji have no glyph and are
 * silently dropped by the renderer. Map them to WinAnsi-safe stand-ins so no
 * report content (checklists, score bars, status dots) disappears in exports.
 */
export function pdfSafeText(text: string): string {
  return text
    .replace(/[✓✔☑✅]/g, '[x]')
    .replace(/[✗✘❌☐❎]/g, '[ ]')
    .replace(/[█]/g, '#')
    .replace(/[▓]/g, '#')
    .replace(/[▒]/g, '-')
    .replace(/[░]/g, '·')
    .replace(/[🟡🟠🟢🔴⚪⚫]/g, '•');
}

function collectText(node: Record<string, unknown> | null | undefined): ReportTextRun[] {
  if (!node) return [];
  const type = node.type;
  if (type === 'text' && typeof node.text === 'string') {
    const format = (node.format as number) || 0;
    const run: ReportTextRun = {
      text: pdfSafeText(node.text),
      bold: Boolean(format & BOLD_MASK),
      italic: Boolean(format & ITALIC_MASK),
      underline: Boolean(format & UNDERLINE_MASK),
      strike: Boolean(format & STRIKETHROUGH_MASK),
    };
    const color = cssColorToHex(parseCssProperty(String(node.style ?? ''), 'color') ?? '');
    if (color) run.color = color;

    const rawFontSize = Number(parseCssProperty(String(node.style ?? ''), 'font-size')?.replace('px', ''));
    if (rawFontSize && Number.isFinite(rawFontSize) && rawFontSize > 0 && rawFontSize < 200) run.fontSize = rawFontSize;

    const family = parseCssProperty(String(node.style ?? ''), 'font-family');
    if (family) run.fontFamily = family.split(',')[0].trim().replace(/['"]/g, '');
    return [run];
  }
  if (type === 'linebreak') return [{ text: '\n' }];
  if (Array.isArray(node.children)) {
    return node.children.flatMap((child) => collectText(child as Record<string, unknown>));
  }
  return [];
}

function textString(node: Record<string, unknown>): string {
  return collectText(node)
    .map((r) => r.text)
    .join('');
}

/** Reads the block background-color (normalised to hex) from an element node's style. */
function blockBackground(node: Record<string, unknown>): string | undefined {
  return cssColorToHex(parseCssProperty(String(node.style ?? ''), 'background-color') ?? '') ?? undefined;
}

/**
 * Converts a serialized Lexical EditorState into a simple block model that
 * both the PDF and Word exporters can render with brand styling. Handles every
 * node the report generator emits — including tables — so no content is dropped.
 */
export function lexicalStateToModel(
  state: Record<string, unknown> | string,
  checkType: CheckType,
  title: string,
  header?: Record<string, unknown> | string | null,
  footer?: Record<string, unknown> | string | null
): ExportModel {
  const childrenOf = (source: Record<string, unknown> | string) => {
    const raw = typeof source === 'string' ? JSON.parse(source) : source;
    const root = (raw?.root ?? raw) as Record<string, unknown> | undefined;
    return (root?.children as Record<string, unknown>[] | undefined) ?? [];
  };

  const blocks: ReportBlock[] = [];

  const convert = (node: Record<string, unknown>) => {
    const type = node.type as string;

    if (type === 'heading') {
      const tag = node.tag as string;
      const level = tag === 'h1' ? 1 : tag === 'h2' ? 2 : 3;
      blocks.push({
        kind: 'heading',
        level,
        text: textString(node),
        runs: collectText(node),
        backgroundColor: blockBackground(node),
      });
    } else if (type === 'paragraph') {
      blocks.push({
        kind: 'paragraph',
        runs: collectText(node),
        text: textString(node),
        backgroundColor: blockBackground(node),
      });
    } else if (type === 'quote') {
      blocks.push({ kind: 'quote', text: textString(node), runs: collectText(node) });
    } else if (type === 'callout') {
      blocks.push({ kind: 'callout', tone: (node.tone as ReportBlock['tone']) ?? 'brand', text: textString(node), runs: collectText(node) });
    } else if (type === 'stickynote') {
      // Sticky notes export as a "note" callout so content survives in PDF/Word.
      blocks.push({ kind: 'callout', tone: 'growth', text: textString(node), runs: collectText(node) });
    } else if (type === 'list') {
      const listType = (node.listType as ReportBlock['listType']) ?? 'bullet';
      const items = (node.children as Record<string, unknown>[] | undefined) ?? [];
      blocks.push({
        kind: 'list',
        listType,
        items: items.map((item) => textString(item)),
        checked: items.map((item) => (item.checked as boolean | undefined) ?? false),
      });
    } else if (type === 'divider' || type === 'horizontalrule' || type === 'pagebreak') {
      blocks.push({ kind: 'divider' });
    } else if (type === 'table') {
      const rows: ReportTableRow[] = ((node.children as Record<string, unknown>[] | undefined) ?? []).map((row) => {
        const cells: ReportTableCell[] = ((row.children as Record<string, unknown>[] | undefined) ?? []).map((cell) => ({
          runs: collectText(cell),
          text: textString(cell),
          header: Number(cell.headerState ?? 0) > 0,
          backgroundColor:
            typeof cell.backgroundColor === 'string'
              ? (cssColorToHex(cell.backgroundColor) ?? undefined)
              : undefined,
        }));
        return { cells };
      });
      blocks.push({ kind: 'table', rows });
    } else if (type === 'image') {
      // Images reference external/site URLs that may not resolve in the
      // exporter — drop them gracefully so the document never breaks.
      const alt = typeof node.alt === 'string' ? node.alt : '';
      if (alt) blocks.push({ kind: 'paragraph', text: `[Image: ${alt}]`, runs: [{ text: `[Image: ${alt}]` }] });
    } else if (type === 'root' || type === 'listitem' || type === 'tablerow' || type === 'tablecell') {
      // recurse
      (node.children as Record<string, unknown>[] | undefined)?.forEach(convert);
    }
  };

  if (header) childrenOf(header).forEach(convert);
  childrenOf(state).forEach(convert);
  if (footer) childrenOf(footer).forEach(convert);

  return { checkType, title, blocks };
}

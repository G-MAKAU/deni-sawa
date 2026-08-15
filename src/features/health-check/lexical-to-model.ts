import type { CheckType } from './types';
import { cssColorToHex, parseCssProperty } from '@/lib/css-color';

export interface ReportTextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
}

export interface ReportBlock {
  kind: 'heading' | 'paragraph' | 'quote' | 'callout' | 'list' | 'divider';
  level?: 1 | 2 | 3;
  text?: string;
  runs?: ReportTextRun[];
  items?: string[];
  tone?: 'brand' | 'growth' | 'dark';
  color?: string;
  backgroundColor?: string;
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

function collectText(node: Record<string, unknown> | null | undefined): ReportTextRun[] {
  if (!node) return [];
  const type = node.type;
  if (type === 'text' && typeof node.text === 'string') {
    const format = (node.format as number) || 0;
    const run: ReportTextRun = {
      text: node.text,
      bold: Boolean(format & BOLD_MASK),
      italic: Boolean(format & ITALIC_MASK),
      underline: Boolean(format & UNDERLINE_MASK),
      strike: Boolean(format & STRIKETHROUGH_MASK),
    };
    const color = cssColorToHex(parseCssProperty(String(node.style ?? ''), 'color') ?? '');
    if (color) run.color = color;
    return [run];
  }
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
 * both the PDF and Word exporters can render with brand styling.
 */
export function lexicalStateToModel(
  state: Record<string, unknown> | string,
  checkType: CheckType,
  title: string
): ExportModel {
  const raw = typeof state === 'string' ? JSON.parse(state) : state;
  const root = (raw?.root ?? raw) as Record<string, unknown> | undefined;
  const children = (root?.children as Record<string, unknown>[] | undefined) ?? [];

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
      blocks.push({ kind: 'quote', text: textString(node) });
    } else if (type === 'callout') {
      blocks.push({ kind: 'callout', tone: (node.tone as ReportBlock['tone']) ?? 'brand', text: textString(node) });
    } else if (type === 'list') {
      const items = (node.children as Record<string, unknown>[] | undefined)?.map((item) =>
        textString(item)
      ) ?? [];
      blocks.push({ kind: 'list', items });
    } else if (type === 'divider') {
      blocks.push({ kind: 'divider' });
    } else if (type === 'root' || type === 'listitem') {
      // recurse
      (node.children as Record<string, unknown>[] | undefined)?.forEach(convert);
    }
  };

  children.forEach(convert);

  return { checkType, title, blocks };
}

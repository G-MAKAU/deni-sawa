import type { CheckType } from './types';

export interface ReportTextRun {
  text: string;
  bold?: boolean;
}

export interface ReportBlock {
  kind: 'heading' | 'paragraph' | 'quote' | 'callout' | 'list' | 'divider';
  level?: 1 | 2 | 3;
  text?: string;
  runs?: ReportTextRun[];
  items?: string[];
  tone?: 'brand' | 'growth' | 'dark';
}

export interface ExportModel {
  checkType: CheckType;
  title: string;
  blocks: ReportBlock[];
}

const BOLD_MASK = 1;

function collectText(node: Record<string, unknown> | null | undefined): ReportTextRun[] {
  if (!node) return [];
  const type = node.type;
  if (type === 'text' && typeof node.text === 'string') {
    return [{ text: node.text, bold: Boolean((node.format as number) & BOLD_MASK) }];
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
      blocks.push({ kind: 'heading', level, text: textString(node) });
    } else if (type === 'paragraph') {
      blocks.push({ kind: 'paragraph', runs: collectText(node), text: textString(node) });
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

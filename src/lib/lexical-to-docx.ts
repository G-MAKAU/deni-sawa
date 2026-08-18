import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  LevelFormat,
  PageNumber,
  Paragraph,
  ShadingType,
  TabStopPosition,
  TabStopType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  type IRunOptions,
} from 'docx';
import { cssColorToHex, parseCssProperty } from '@/lib/css-color';

const ORANGE = 'E8510A';
const GREEN = '5A9E28';
const DARK = '1A1A1A';
const MUTED = '666666';
const LIGHT = 'FDF3EC';
const GROWTH_LIGHT = 'F4F9EE';

// Lexical text format bitmask.
const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_UNDERLINE = 4;
const FORMAT_STRIKETHROUGH = 8;
const FORMAT_CODE = 16;

interface Node {
  type?: string;
  text?: string;
  format?: number;
  style?: string;
  tag?: string;
  listType?: string;
  tone?: string;
  url?: string;
  children?: Node[];
}

function run(text: string, opts: Partial<IRunOptions> = {}): TextRun {
  return new TextRun({ text, font: 'Calibri', size: 22, color: DARK, ...opts });
}

/** docx fill/color values expect a 6-digit hex without the leading '#'. */
function docxHex(color: string): string {
  return color.replace('#', '');
}

/** Maps a CSS font-family stack to a Word-safe font (falls back gracefully). */
function docxFamily(family: string): string {
  const fam = family.toLowerCase();
  if (fam.includes('times') || fam.includes('georgia') || fam.includes('serif')) return 'Georgia';
  if (fam.includes('courier') || fam.includes('mono')) return 'Courier New';
  if (fam.includes('arial') || fam.includes('helvetica')) return 'Arial';
  return 'Calibri';
}

/** Paragraph shading (background colour) derived from an element node's style. */
function blockShading(node: Node) {
  const bg = cssColorToHex(parseCssProperty(node.style ?? '', 'background-color') ?? '');
  return bg ? { type: ShadingType.CLEAR, color: 'auto' as const, fill: docxHex(bg) } : undefined;
}

/** A run or a hyperlink, carrying its text and options so it can be rebuilt with overrides (italics, breaks, etc.). */
type RichChild =
  | { kind: 'run'; text: string; options: Partial<IRunOptions> }
  | { kind: 'link'; text: string; url: string; options: Partial<IRunOptions> };

function runFor(child: RichChild, overrides: Partial<IRunOptions> = {}): RichChild {
  return { ...child, options: { ...child.options, ...overrides } };
}

function toDocxChild(child: RichChild): TextRun | ExternalHyperlink {
  const textRun = run(child.text, child.options);
  if (child.kind === 'link') {
    // Real clickable hyperlink in Word (orange, underlined).
    return new ExternalHyperlink({ link: child.url, children: [textRun] });
  }
  return textRun;
}

/** Builds styled runs from a node's inline children (text / link nodes). */
function runsFromChildren(children: Node[] | undefined): RichChild[] {
  const runs: RichChild[] = [];
  const walk = (nodes: Node[] | undefined) => {
    (nodes ?? []).forEach((child) => {
      if (child.type === 'text' || child.type === 'link') {
        const format = child.format ?? 0;
        const isLink = child.type === 'link';
        const color = cssColorToHex(parseCssProperty(child.style ?? '', 'color') ?? '');
        const px = Number(parseCssProperty(child.style ?? '', 'font-size')?.replace('px', ''));
        const family = parseCssProperty(child.style ?? '', 'font-family');
        const options: Partial<IRunOptions> = {
          bold: (format & FORMAT_BOLD) !== 0 || undefined,
          italics: (format & FORMAT_ITALIC) !== 0 || undefined,
          underline: (format & FORMAT_UNDERLINE) !== 0 ? {} : undefined,
          strike: (format & FORMAT_STRIKETHROUGH) !== 0 || undefined,
          ...(color ? { color: docxHex(color) } : {}),
          ...(px ? { size: Math.round(px * 1.5) } : {}),
          ...(family ? { font: docxFamily(family) } : {}),
          ...(isLink ? { color: ORANGE } : {}),
        };
        const text = child.text ?? '';
        if (isLink && child.url) {
          runs.push({ kind: 'link', text, url: child.url, options });
        } else {
          runs.push({ kind: 'run', text, options });
        }
      } else if (child.children) {
        walk(child.children);
      }
    });
  };
  walk(children);
  return runs;
}

function buildHeader(title: string): Header {
  return new Header({
    children: [
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E0E0E0' } },
        spacing: { after: 120 },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({ text: 'DENI ', font: 'Calibri', size: 20, bold: true, color: DARK }),
          new TextRun({ text: 'SAWA', font: 'Calibri', size: 20, bold: true, color: ORANGE }),
          new TextRun({ text: '  PARTNERS', font: 'Calibri', size: 12, color: MUTED }),
          new TextRun({ text: title.toUpperCase(), font: 'Calibri', size: 16, color: MUTED, bold: true }),
        ],
      }),
    ],
  });
}

function buildFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'E0E0E0' } },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          run('Deni Sawa Partners · Confidential', { size: 16, color: MUTED }),
          new TextRun({
            children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
            font: 'Calibri',
            size: 16,
            color: MUTED,
          }),
        ],
      }),
    ],
  });
}

function buildTitle(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 80 },
    children: [new TextRun({ text: title, font: 'Calibri', size: 48, bold: true, color: DARK })],
  });
}

function blockParagraph(node: Node): Paragraph {
  const headingTag = node.type === 'heading' ? node.tag : undefined;
  const runs = runsFromChildren(node.children).map(toDocxChild);
  const shading = blockShading(node);

  if (headingTag === 'h1') {
    return new Paragraph({
      spacing: { before: 240, after: 120 },
      ...(shading ? { shading } : {}),
      children: runs.length ? runs : [new TextRun({ text: '', size: 40, bold: true, color: DARK })],
      style: 'TitleBig',
    });
  }
  if (headingTag === 'h2') {
    return new Paragraph({
      spacing: { before: 280, after: 120 },
      ...(shading ? { shading } : {}),
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E0E0E0' } },
      children: runs.length ? runs : [run('')],
    });
  }
  if (headingTag && headingTag !== 'h1' && headingTag !== 'h2') {
    return new Paragraph({
      spacing: { before: 200, after: 80 },
      ...(shading ? { shading } : {}),
      children: runs.length ? runs : [run('')],
    });
  }
  return new Paragraph({
    spacing: { after: 100 },
    ...(shading ? { shading } : {}),
    children: runs.length ? runs : [run('')],
  });
}

/**
 * Converts a serialized Lexical EditorState into a branded Word document.
 * Used by the token-based Word export route. Optional header/footer Lexical
 * states are rendered at the top/bottom of the document body.
 */
export function lexicalStateToDocx(
  state: Record<string, unknown> | string,
  title: string,
  header?: Record<string, unknown> | string | null,
  footer?: Record<string, unknown> | string | null
): Document {
  const rootOf = (source: Record<string, unknown> | string | null | undefined): Node | undefined => {
    if (!source) return undefined;
    if (typeof source === 'string') {
      try {
        return (JSON.parse(source) as { root?: Node }).root;
      } catch {
        return undefined;
      }
    }
    return (source as { root?: Node }).root;
  };

  const children: (Paragraph | Table)[] = [buildTitle(title)];

  const appendRoot = (root: Node | undefined) => {
    (root?.children ?? []).forEach((node) => {
      switch (node.type) {
        case 'heading':
        case 'paragraph':
          children.push(blockParagraph(node));
          break;
        case 'quote': {
          const quoteRuns = runsFromChildren(node.children).map((c) => runFor(c, { italics: true })).map(toDocxChild);
          children.push(
            new Paragraph({
              spacing: { before: 120, after: 120 },
              indent: { left: 360 },
              border: { left: { style: BorderStyle.SINGLE, size: 18, color: ORANGE } },
              children: quoteRuns.length
                ? quoteRuns
                : [new TextRun({ text: '', font: 'Calibri', size: 22, italics: true, color: DARK })],
            })
          );
          break;
        }
        case 'callout': {
          const isGrowth = node.tone === 'growth';
          const label = node.tone === 'growth' ? 'NOTE' : 'PRIORITY';
          const calloutRuns: (TextRun | ExternalHyperlink)[] = [
            new TextRun({ text: label, font: 'Calibri', size: 14, bold: true, color: isGrowth ? GREEN : ORANGE, allCaps: true }),
          ];
          // Insert a line break before each run/hyperlink that follows the label.
          runsFromChildren(node.children).forEach((c) => {
            const withBreak = runFor(c, { break: 1 });
            calloutRuns.push(toDocxChild(withBreak));
          });
          children.push(
            new Paragraph({
              spacing: { before: 160, after: 160 },
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: isGrowth ? GROWTH_LIGHT : LIGHT },
              border: { left: { style: BorderStyle.SINGLE, size: 24, color: isGrowth ? GREEN : ORANGE } },
              children: calloutRuns,
            })
          );
          break;
        }
        case 'list': {
          const listType = node.listType ?? 'bullet';
          (node.children ?? []).forEach((item, index) => {
            const itemRuns = runsFromChildren(item.children).map(toDocxChild);
            const checked = (item as { checked?: boolean }).checked;
            const markerPrefix = listType === 'check' ? (checked ? '☑ ' : '☐ ') : listType === 'number' ? `${index + 1}. ` : '• ';
            children.push(
              new Paragraph({
                spacing: { after: 60 },
                indent: { left: 420, hanging: 240 },
                bullet: listType === 'bullet' ? { level: 0 } : undefined,
                children:
                  itemRuns.length > 0
                    ? [new TextRun({ text: markerPrefix, font: 'Calibri', size: 22, color: listType === 'check' ? GREEN : DARK, bold: true }), ...itemRuns]
                    : [run(markerPrefix)],
              })
            );
          });
          break;
        }
        case 'table': {
          const rows = (node.children ?? []).map((row) => {
            const cells = (row.children ?? []).map((cell, cellIndex) => {
              const isHeader = Number((cell as { headerState?: number }).headerState ?? 0) > 0;
              const cellRuns = runsFromChildren(cell.children).map(toDocxChild);
              const cellBg = cssColorToHex(String((cell as { backgroundColor?: string }).backgroundColor ?? ''));
              return new TableCell({
                width: { size: 100 / Math.max(1, (row.children ?? []).length), type: WidthType.PERCENTAGE },
                shading: isHeader
                  ? { type: ShadingType.CLEAR, color: 'auto', fill: 'F6F0E8' }
                  : cellBg
                    ? { type: ShadingType.CLEAR, color: 'auto', fill: docxHex(cellBg) }
                    : undefined,
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    spacing: { after: 0 },
                    children: cellRuns.length
                      ? cellRuns
                      : [new TextRun({ text: cellIndex === 0 ? (cell as { type?: string }).type ?? '' : '', font: 'Calibri', size: 22, color: DARK })],
                  }),
                ],
              });
            });
            return new TableRow({ children: cells });
          });
          children.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'D8D8D8' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D8D8D8' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'D8D8D8' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'D8D8D8' },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E0E0E0' },
                insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E0E0E0' },
              },
              rows,
            })
          );
          break;
        }
        case 'divider':
        default:
          children.push(
            new Paragraph({
              spacing: { before: 120, after: 120 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E0E0E0' } },
              children: [],
            })
          );
      }
    });
  };

  appendRoot(rootOf(header));
  appendRoot(rootOf(state));
  appendRoot(rootOf(footer));

  return new Document({
    creator: 'Deni Sawa Partners',
    title: `${title} — Deni Sawa Partners`,
    description: 'Diagnostic Health Report',
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22, color: DARK } },
      },
      paragraphStyles: [
        {
          id: 'TitleBig',
          name: 'Title Big',
          basedOn: 'Normal',
          next: 'Normal',
          run: { font: 'Calibri', size: 40, bold: true, color: DARK },
        },
      ],
    },
    sections: [
      {
        headers: { default: buildHeader(title) },
        footers: { default: buildFooter() },
        properties: {},
        children,
      },
    ],
  });
}

export { AlignmentType as DocxAlignment, ORANGE, GREEN, DARK, MUTED };

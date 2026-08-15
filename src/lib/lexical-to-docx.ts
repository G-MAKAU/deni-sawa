import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  PageNumber,
  Paragraph,
  ShadingType,
  TabStopPosition,
  TabStopType,
  TextRun,
  type IRunOptions,
} from 'docx';

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
  tag?: string;
  listType?: string;
  tone?: string;
  url?: string;
  children?: Node[];
}

function run(text: string, opts: Partial<IRunOptions> = {}): TextRun {
  return new TextRun({ text, font: 'Calibri', size: 22, color: DARK, ...opts });
}

/** Builds styled runs from a node's inline children (text / link nodes). */
function runsFromChildren(children: Node[] | undefined): TextRun[] {
  const runs: TextRun[] = [];
  const walk = (nodes: Node[] | undefined) => {
    (nodes ?? []).forEach((child) => {
      if (child.type === 'text' || child.type === 'link') {
        const format = child.format ?? 0;
        const isLink = child.type === 'link';
        const options: Partial<IRunOptions> = {
          bold: (format & FORMAT_BOLD) !== 0 || undefined,
          italics: (format & FORMAT_ITALIC) !== 0 || undefined,
          underline: (format & FORMAT_UNDERLINE) !== 0 ? {} : undefined,
          strike: (format & FORMAT_STRIKETHROUGH) !== 0 || undefined,
          ...(isLink ? { color: ORANGE } : {}),
        };
        runs.push(run(child.text ?? '', options));
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
  const runs = runsFromChildren(node.children);

  if (headingTag === 'h1') {
    return new Paragraph({ spacing: { before: 240, after: 120 }, children: runs.length ? runs : [new TextRun({ text: '', size: 40, bold: true, color: DARK })] , style: 'TitleBig' });
  }
  if (headingTag === 'h2') {
    return new Paragraph({
      spacing: { before: 280, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E0E0E0' } },
      children: runs.length ? runs : [run('')],
    });
  }
  if (headingTag && headingTag !== 'h1' && headingTag !== 'h2') {
    return new Paragraph({ spacing: { before: 200, after: 80 }, children: runs.length ? runs : [run('')] });
  }
  return new Paragraph({ spacing: { after: 100 }, children: runs.length ? runs : [run('')] });
}

/**
 * Converts a serialized Lexical EditorState into a branded Word document.
 * Used by the token-based Word export route.
 */
export function lexicalStateToDocx(state: Record<string, unknown> | string, title: string): Document {
  let root: Node | undefined;
  if (typeof state === 'string') {
    try {
      root = (JSON.parse(state) as { root?: Node }).root;
    } catch {
      root = undefined;
    }
  } else {
    root = (state as { root?: Node }).root;
  }

  const children: Paragraph[] = [buildTitle(title)];
  (root?.children ?? []).forEach((node) => {
    switch (node.type) {
      case 'heading':
      case 'paragraph':
        children.push(blockParagraph(node));
        break;
      case 'quote': {
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 120 },
            indent: { left: 360 },
            border: { left: { style: BorderStyle.SINGLE, size: 18, color: ORANGE } },
            children: runsFromChildren(node.children).length
              ? runsFromChildren(node.children).map((r) => new TextRun({ ...r, italics: true }))
              : [new TextRun({ text: '', font: 'Calibri', size: 22, italics: true, color: DARK })],
          })
        );
        break;
      }
      case 'callout': {
        const isGrowth = node.tone === 'growth';
        const label = node.tone === 'growth' ? 'NOTE' : 'PRIORITY';
        children.push(
          new Paragraph({
            spacing: { before: 160, after: 160 },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: isGrowth ? GROWTH_LIGHT : LIGHT },
            border: { left: { style: BorderStyle.SINGLE, size: 24, color: isGrowth ? GREEN : ORANGE } },
            children: [
              new TextRun({ text: label, font: 'Calibri', size: 14, bold: true, color: isGrowth ? GREEN : ORANGE, allCaps: true }),
              ...(runsFromChildren(node.children).map((r) => new TextRun({ break: 1, ...r })) as TextRun[]),
            ],
          })
        );
        break;
      }
      case 'list':
        (node.children ?? []).forEach((item) =>
          children.push(
            new Paragraph({
              spacing: { after: 60 },
              indent: { left: 420, hanging: 200 },
              bullet: { level: 0 },
              children: runsFromChildren(item.children).length ? runsFromChildren(item.children) : [run('')],
            })
          )
        );
        break;
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

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  $isTextNode,
  $createParagraphNode,
  $isParagraphNode,
  $isNodeSelection,
  $getNodeByKey,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  type ElementNode,
  type LexicalNode,
  type TextFormatType,
  type TextNode,
} from 'lexical';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $createCodeNode, $isCodeNode } from '@lexical/code';
import { $patchStyleText, $setBlocksType } from '@lexical/selection';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  $isListNode,
} from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $createTableNodeWithDimensions, $isTableNode, $isTableSelection, $isTableCellNode, type TableCellNode } from '@lexical/table';
import { $findMatchingParent } from '@lexical/utils';
import { $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { $isImageNode, type ImageLayout } from '../nodes/ImageNode';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Code2,
  Undo2,
  Redo2,
  ChevronDown,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Minus,
  MessageSquareQuote,
  Table as TableIcon,
  Grid2X2,
  Indent,
  Outdent,
  Eraser,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Upload,
  Subscript,
  Superscript,
  X,
  Palette,
  PaintBucket,
} from 'lucide-react';
import { $createCalloutNode, $isCalloutNode } from '../nodes/CalloutNode';
import { $createDividerNode, $isDividerNode } from '../nodes/DividerNode';
import { $createImageNode } from '../nodes/ImageNode';
import { $createVariableNode } from '../nodes/VariableNode';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { cssColorToHex, parseCssProperty, setCssProperty } from '@/lib/css-color';

type BlockFormat =
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'code'
  | 'callout'
  | 'divider'
  | 'table'
  | 'bullet'
  | 'number'
  | 'check';

const blockLabels: Record<BlockFormat, string> = {
  paragraph: 'Paragraph',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  quote: 'Quote',
  code: 'Code Block',
  callout: 'Callout',
  divider: 'Divider',
  table: 'Table',
  bullet: 'Bulleted List',
  number: 'Numbered List',
  check: 'Check List',
};

const blockOrder: BlockFormat[] = [
  'paragraph',
  'h1',
  'h2',
  'h3',
  'quote',
  'code',
  'callout',
  'divider',
  'table',
  'bullet',
  'number',
  'check',
];

interface ToolbarState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  subscript: boolean;
  superscript: boolean;
  block: BlockFormat;
  textColor: string | null;
  blockBg: string | null;
  /** Number of table cells selected (0 = no cell selection). */
  cellCount: number;
  /** Background colour of the first selected cell, normalised to hex. */
  cellBg: string | null;
  canUndo: boolean;
  canRedo: boolean;
}

const initialToolbar: ToolbarState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  code: false,
  subscript: false,
  superscript: false,
  block: 'paragraph',
  textColor: null,
  blockBg: null,
  cellCount: 0,
  cellBg: null,
  canUndo: false,
  canRedo: false,
};

/** Detect the block format of the current selection. */
function getSelectionBlock(selection: ReturnType<typeof $getSelection>): BlockFormat {
  if (!$isRangeSelection(selection)) return 'paragraph';
  try {
    const node = selection.anchor.getNode();
    let block: ElementNode | null = null;
    if ($isElementNode(node)) block = node;
    else block = node.getParent() ?? null;

    while (block) {
      if ($isHeadingNode(block)) return block.getTag() as 'h1' | 'h2' | 'h3';
      if ($isQuoteNode(block)) return 'quote';
      if ($isCodeNode(block)) return 'code';
      if ($isListNode(block)) {
        const tag = block.getTag();
        if (tag === 'ul') return 'bullet';
        if (tag === 'ol') return 'number';
        return 'check';
      }
      if ($isCalloutNode(block)) return 'callout';
      if ($isDividerNode(block)) return 'divider';
      if ($isTableNode(block)) return 'table';
      block = block.getParent();
    }
  } catch {
    // A selection can leak from a sibling editor (e.g. the read-only report
    // preview on the same page). Degrade gracefully instead of crashing.
    return 'paragraph';
  }
  return 'paragraph';
}

/** Reads the colour of the text at the selection anchor, normalised to hex. */
function getTextColor(selection: ReturnType<typeof $getSelection>): string | null {
  if (!$isRangeSelection(selection)) return null;
  try {
    // Only read from the anchor node — never selection.getNodes(), which walks
    // the caret range and throws on a selection leaked from a sibling editor.
    const anchor = selection.anchor.getNode();
    if ($isTextNode(anchor)) {
      return cssColorToHex(parseCssProperty(anchor.getStyle(), 'color') ?? '');
    }
    if ($isElementNode(anchor)) {
      const first = anchor.getFirstChild();
      if (first && $isTextNode(first)) {
        return cssColorToHex(parseCssProperty(first.getStyle(), 'color') ?? '');
      }
    }
  } catch {
    // Never let a stale selection from a sibling editor crash the toolbar.
    return null;
  }
  return null;
}

/** Reads a CSS property value from the selection anchor's text style (e.g. font-size). */
function getSelectionStyle(selection: ReturnType<typeof $getSelection>, prop: string): string | null {
  if (!$isRangeSelection(selection)) return null;
  try {
    const anchor = selection.anchor.getNode();
    const style = $isTextNode(anchor)
      ? anchor.getStyle()
      : $isElementNode(anchor)
        ? (() => {
            const first = anchor.getFirstChild();
            return first && $isTextNode(first) ? (first as TextNode).getStyle() : '';
          })()
        : '';
    return parseCssProperty(style, prop) ?? null;
  } catch {
    return null;
  }
}

/** Reads the background-color of the anchor block (paragraph/heading), normalised to hex. */
function getBlockBackground(selection: ReturnType<typeof $getSelection>): string | null {
  if (!$isRangeSelection(selection)) return null;
  try {
    const node = selection.anchor.getNode();
    let block: ElementNode | null = null;
    if ($isElementNode(node)) block = node;
    else block = node.getParent() ?? null;
    if (!block || !($isParagraphNode(block) || $isHeadingNode(block))) return null;
    return cssColorToHex(parseCssProperty(block.getStyle(), 'background-color') ?? '');
  } catch {
    return null;
  }
}

/** Resolves the cell(s) under a selection: multi-cell TableSelection or a
 *  single cell containing the caret. Returns the TableCellNodes. */
function getSelectedCells(selection: ReturnType<typeof $getSelection>): TableCellNode[] {
  try {
    if ($isTableSelection(selection)) {
      return selection.getNodes().filter($isTableCellNode) as TableCellNode[];
    }
    if ($isRangeSelection(selection)) {
      const anchor = selection.anchor.getNode();
      const cell = $isTableCellNode(anchor)
        ? anchor
        : $findMatchingParent(anchor, $isTableCellNode);
      return cell ? [cell] : [];
    }
  } catch {
    /* fall through */
  }
  return [];
}

/** Reads the background colour of the first selected cell, normalised to hex. */
function getCellBackground(selection: ReturnType<typeof $getSelection>): string | null {
  const cells = getSelectedCells(selection);
  if (cells.length === 0) return null;
  const first = cells[0].getBackgroundColor();
  return first ? (cssColorToHex(first) ?? null) : null;
}

/** Walks every descendant text node of a node, calling cb for each. */
function $forEachTextNode(node: LexicalNode, cb: (text: TextNode) => void): void {
  if ($isTextNode(node)) {
    cb(node);
    return;
  }
  if ($isElementNode(node)) {
    node.getChildren().forEach((child) => $forEachTextNode(child, cb));
  }
}

const ToolbarButton = ({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    disabled={disabled}
    title={title}
    aria-label={title}
    aria-pressed={active}
    className={cn(
      'flex h-9 w-9 items-center justify-center rounded-btn text-foreground/70 transition-colors',
      active ? 'bg-brand/15 text-brand' : 'hover:bg-bgalt hover:text-brand',
      disabled && 'cursor-not-allowed opacity-30'
    )}
  >
    {children}
  </button>
);

const ToolbarSep = () => <div className="mx-1 hidden h-5 w-px bg-card-border sm:block" />;

const IMAGE_LAYOUTS: Array<{ value: ImageLayout; label: string }> = [
  { value: 'inline', label: 'Inline' },
  { value: 'square-left', label: 'Square left' },
  { value: 'square-right', label: 'Square right' },
  { value: 'tight-left', label: 'Tight left' },
  { value: 'tight-right', label: 'Tight right' },
  { value: 'center', label: 'Center' },
  { value: 'behind', label: 'Behind text' },
  { value: 'front', label: 'In front of text' },
];

const FONT_SIZES = ['12', '13', '14', '15', '16', '18', '20', '24', '28', '32'];

const FONT_FAMILIES: Array<{ label: string; value: string }> = [
  { label: 'Inter (Body)', value: 'Inter, system-ui, sans-serif' },
  { label: 'Georgia (Display)', value: 'Georgia, "Times New Roman", serif' },
  { label: 'JetBrains Mono (Mono)', value: '"JetBrains Mono", ui-monospace, monospace' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
];

const COLOR_PRESETS: Array<{ name: string; value: string }> = [  { name: 'Brand', value: '#E8510A' },
  { name: 'Growth', value: '#5A9E28' },
  { name: 'Ink', value: '#1A1A1A' },
  { name: 'Muted', value: '#666666' },
  { name: 'Hint', value: '#7A5A00' },
  { name: 'Light', value: '#F9F7F5' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Brand/10', value: '#FDF3EC' },
];

/** Perceived luminance so preset labels stay legible on any swatch. */
function swatchTextColor(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111111' : '#FFFFFF';
}

const ColorControl = ({
  label,
  icon,
  value,
  onChange,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  value: string | null;
  onChange: (color: string | null) => void;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [customColor, setCustomColor] = useState<string>(value ?? '#E8510A');

  // Keep the pending custom colour in sync with the applied colour.
  useEffect(() => {
    setCustomColor(value ?? '#E8510A');
  }, [value]);

  return (
    <div className="relative">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          if (!disabled) setOpen((o) => !o);
        }}
        disabled={disabled}
        title={label}
        aria-label={label}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-btn text-foreground/70 transition-colors',
          disabled && 'cursor-not-allowed opacity-30',
          open || value ? 'bg-brand/15 text-brand' : 'hover:bg-bgalt hover:text-brand'
        )}
      >
        {icon}
        {value && (
          <span
            className="absolute bottom-1 left-1/2 h-[5px] w-5 -translate-x-1/2 rounded-full border border-card-border"
            style={{ backgroundColor: value }}
          />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onMouseDown={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-60 rounded-lg border border-card-border bg-card p-2 shadow-card-hover">
            <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="grid grid-cols-4 gap-1.5">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(preset.value);
                    setOpen(false);
                  }}
                  title={preset.name}
                  className="flex h-8 items-center justify-center rounded-md border border-card-border text-[10px] font-bold transition-transform hover:scale-105"
                  style={{ backgroundColor: preset.value, color: swatchTextColor(preset.value) }}
                >
                  Aa
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1.5 border-t border-card-border pt-2">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  inputRef.current?.click();
                }}
                title="Open colour picker"
                className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border border-card-border px-2 text-xs font-medium text-foreground transition-colors hover:border-brand/40"
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-sm border border-card-border"
                  style={{ backgroundColor: customColor }}
                />
                <span className="truncate font-mono text-[11px] text-muted-foreground">{customColor}</span>
              </button>
              <input
                ref={inputRef}
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="sr-only"
                tabIndex={-1}
              />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(customColor);
                  setOpen(false);
                }}
                title="Apply custom colour"
                aria-label="Apply custom colour"
                className="h-8 rounded-md bg-brand px-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
              >
                Apply
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(null);
                  setOpen(false);
                }}
                title="Clear colour"
                aria-label="Clear colour"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-card-border text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
              >
                <Eraser className="h-3.5 w-3.5" />
              </button>
            </div>
            {value && (
              <p className="mt-2 flex items-center gap-1.5 border-t border-card-border pt-2 text-[11px] text-muted-foreground">
                <span
                  className="inline-block h-3.5 w-3.5 rounded-sm border border-card-border"
                  style={{ backgroundColor: value }}
                />
                Selected · <span className="font-mono text-foreground">{value}</span>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export function ToolbarPlugin({
  variables,
  onUploadImage,
  onBrowseImage,
  floating = false,
}: {
  variables?: string[];
  onUploadImage?: (file: File) => Promise<string>;
  onBrowseImage?: () => Promise<string | null>;
  /** Floating mode strips the toolbar's own card border/rounding so the parent
   *  can render it as a full-width sticky bar with a clean divider line. */
  floating?: boolean;
}) {
  const [editor] = useLexicalComposerContext();
  const [toolbar, setToolbar] = useState<ToolbarState>(initialToolbar);
  const [blockOpen, setBlockOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [varOpen, setVarOpen] = useState(false);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [vertOpen, setVertOpen] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [fontFamilyOpen, setFontFamilyOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ key: string; layout: ImageLayout } | null>(null);
  const [fontSize, setFontSize] = useState<string | null>(null);
  const [fontFamily, setFontFamily] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // Last valid selection, kept so colour applies work even if the toolbar
  // interaction briefly steals focus (e.g. the native colour picker dialog).
  const selectionRef = useRef<ReturnType<typeof $getSelection>>(null);
  // Keys of the cells under the last selection — a resilient fallback so cell
  // formatting always applies even if the live selection is null/cleared while
  // the toolbar dropdown is open.
  const cellKeysRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const updateToolbar = () => {
      editor.getEditorState().read(() => {
        try {
          const selection = $getSelection();
          if ($isRangeSelection(selection) || $isTableSelection(selection)) selectionRef.current = selection;
          const hasFormat = (type: TextFormatType) =>
            $isRangeSelection(selection) && selection.hasFormat(type);

          // Detect a selected image so the Layout dropdown can appear.
          if ($isNodeSelection(selection) && selection.getNodes().length === 1) {
            const node = selection.getNodes()[0];
            if ($isImageNode(node)) {
              setSelectedImage({ key: node.getKey(), layout: node.getLayout() });
            } else {
              setSelectedImage(null);
            }
          } else {
            setSelectedImage(null);
          }

          setFontSize(getSelectionStyle(selection, 'font-size'));
          setFontFamily(getSelectionStyle(selection, 'font-family'));

          setToolbar((prev) => ({
            ...prev,
            bold: hasFormat('bold'),
            italic: hasFormat('italic'),
            underline: hasFormat('underline'),
            strikethrough: hasFormat('strikethrough'),
            code: hasFormat('code'),
            subscript: hasFormat('subscript'),
            superscript: hasFormat('superscript'),
            block: getSelectionBlock(selection),
            textColor: getTextColor(selection),
            blockBg: getBlockBackground(selection),
            cellCount: getSelectedCells(selection).length,
            cellBg: getCellBackground(selection),
          }));

          const selectedCells = getSelectedCells(selection);
          cellKeysRef.current = selectedCells.length > 0 ? new Set(selectedCells.map((c) => c.getKey())) : null;
        } catch {
          // Never let a stale selection from a sibling editor crash the toolbar.
          setToolbar((prev) => ({ ...prev, block: 'paragraph' }));
        }
      });
    };

    updateToolbar();
    const unregister = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
    const unregisterUpdate = editor.registerUpdateListener(() => updateToolbar());
    const unregisterUndo = editor.registerCommand<boolean>(
      CAN_UNDO_COMMAND,
      (payload) => {
        setToolbar((prev) => ({ ...prev, canUndo: payload }));
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
    const unregisterRedo = editor.registerCommand<boolean>(
      CAN_REDO_COMMAND,
      (payload) => {
        setToolbar((prev) => ({ ...prev, canRedo: payload }));
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
    return () => {
      unregister();
      unregisterUpdate();
      unregisterUndo();
      unregisterRedo();
    };
  }, [editor]);

  useEffect(() => {
    if (linkOpen) linkInputRef.current?.focus();
  }, [linkOpen]);

  const applyBlock = useCallback(
    (format: BlockFormat) => {
      setBlockOpen(false);
      editor.focus();
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        switch (format) {
          case 'divider': {
            // Insert the divider and a trailing paragraph in a single call so
            // the reconciler keeps both nodes, then move the caret into the
            // paragraph so typing continues normally.
            const paragraph = $createParagraphNode();
            selection.insertNodes([$createDividerNode(), paragraph]);
            paragraph.selectStart();
            return;
          }
          case 'table': {
            selection.insertNodes([$createTableNodeWithDimensions(3, 3)]);
            return;
          }
          case 'callout': {
            $setBlocksType(selection, () => $createCalloutNode());
            return;
          }
          case 'code': {
            $setBlocksType(selection, () => $createCodeNode());
            return;
          }
          case 'h1':
          case 'h2':
          case 'h3': {
            $setBlocksType(selection, () => $createHeadingNode(format));
            return;
          }
          case 'quote': {
            $setBlocksType(selection, () => $createQuoteNode());
            return;
          }
          case 'bullet':
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            return;
          case 'number':
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            return;
          case 'check':
            editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
            return;
          default:
            $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    },
    [editor]
  );

  const insertHorizontalRule = useCallback(() => {
    editor.focus();
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      selection.insertNodes([$createHorizontalRuleNode()]);
    });
  }, [editor]);

  const handleLink = useCallback(() => {
    if (!linkUrl.trim()) return;
    const normalized = /^(https?:\/\/|mailto:|#)/i.test(linkUrl) ? linkUrl : `https://${linkUrl}`;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalized);
    setLinkUrl('');
    setLinkOpen(false);
  }, [editor, linkUrl]);

  const clearFormatting = useCallback(() => {
    editor.focus();
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      selection.getNodes().forEach((node) => {
        if ($isTextNode(node)) {
          node.setFormat(0);
          node.setStyle('');
        }
      });
      const node = selection.anchor.getNode();
      let block: ElementNode | null = null;
      if ($isElementNode(node)) block = node;
      else block = node.getParent() ?? null;
      if (block && ($isParagraphNode(block) || $isHeadingNode(block))) {
        block.setStyle(setCssProperty(block.getStyle(), 'background-color', null));
      }
    });
  }, [editor]);

  const applyTextColor = useCallback(
    (color: string | null) => {
      editor.update(() => {
        const selection = $getSelection() ?? selectionRef.current;
        if (!selection) return;
        const cells = getSelectedCells(selection);
        if (cells.length > 0) {
          cells.forEach((cell) =>
            cell.getChildren().forEach((child) =>
              $forEachTextNode(child, (t) => t.setStyle(setCssProperty(t.getStyle(), 'color', color)))
            )
          );
          return;
        }
        if (!$isRangeSelection(selection)) return;
        $patchStyleText(selection, { color: color ? color : null });
      });
    },
    [editor]
  );

  const applyBlockBackground = useCallback(
    (color: string | null) => {
      editor.update(() => {
        const current = $getSelection();
        const selection =
          $isRangeSelection(current) ? current : ($isRangeSelection(selectionRef.current) ? selectionRef.current : null);
        if (!selection) return;
        const node = selection.anchor.getNode();
        let block: ElementNode | null = null;
        if ($isElementNode(node)) block = node;
        else block = node.getParent() ?? null;
        if (!block || !($isParagraphNode(block) || $isHeadingNode(block))) return;
        block.setStyle(setCssProperty(block.getStyle(), 'background-color', color));
      });
    },
    [editor]
  );

  /** Resolves the currently selected table cells, falling back to the keys
   *  captured at selection time when the live selection is null/cleared. */
  const resolveSelectedCells = () => {
    const selection = $getSelection() ?? selectionRef.current;
    let cells = selection ? getSelectedCells(selection) : [];
    if (cells.length === 0 && cellKeysRef.current) {
      cells = [...cellKeysRef.current]
        .map((key) => $getNodeByKey(key))
        .filter((n): n is TableCellNode => $isTableCellNode(n));
    }
    return cells;
  };

  /** Applies a background colour to every selected table cell (1..N). */
  const applyCellBackground = useCallback(
    (color: string | null) => {
      editor.update(() => {
        resolveSelectedCells().forEach((cell) => cell.setBackgroundColor(color));
      });
    },
    [editor]
  );

  /** Horizontal text alignment for every selected cell. */
  const applyCellAlignment = useCallback(
    (align: 'left' | 'center' | 'right' | 'justify') => {
      editor.update(() => {
        resolveSelectedCells().forEach((cell) => {
          cell.getChildren().forEach((block) => {
            if ($isParagraphNode(block) || $isHeadingNode(block)) {
              block.setStyle(setCssProperty(block.getStyle(), 'text-align', align));
            }
          });
        });
      });
    },
    [editor]
  );

  /** Vertical alignment for every selected cell. */
  const applyCellVerticalAlign = useCallback(
    (align: 'top' | 'middle' | 'bottom') => {
      editor.update(() => {
        resolveSelectedCells().forEach((cell) => cell.setVerticalAlign(align));
      });
    },
    [editor]
  );

  const applyFontSize = useCallback(
    (px: string) => {
      editor.update(() => {
        const selection = $getSelection() ?? selectionRef.current;
        if (!selection) return;
        const cells = getSelectedCells(selection);
        if (cells.length > 0) {
          cells.forEach((cell) =>
            cell.getChildren().forEach((child) =>
              $forEachTextNode(child, (t) => t.setStyle(setCssProperty(t.getStyle(), 'font-size', `${px}px`)))
            )
          );
          return;
        }
        if (!$isRangeSelection(selection)) return;
        $patchStyleText(selection, { 'font-size': px ? `${px}px` : null });
      });
    },
    [editor]
  );

  const applyFontFamily = useCallback(
    (family: string) => {
      editor.update(() => {
        const selection = $getSelection() ?? selectionRef.current;
        if (!selection) return;
        const cells = getSelectedCells(selection);
        if (cells.length > 0) {
          cells.forEach((cell) =>
            cell.getChildren().forEach((child) =>
              $forEachTextNode(child, (t) => t.setStyle(setCssProperty(t.getStyle(), 'font-family', family)))
            )
          );
          return;
        }
        if (!$isRangeSelection(selection)) return;
        $patchStyleText(selection, { 'font-family': family });
      });
    },
    [editor]
  );

  const insertVariable = useCallback(
    (name: string) => {
      setVarOpen(false);
      editor.focus();
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        selection.insertNodes([$createVariableNode(name)]);
      });
    },
    [editor]
  );

  const handleImagePick = useCallback(
    async (file: File | undefined) => {
      if (!file || !onUploadImage) return;
      setUploadingImage(true);
      try {
        const src = await onUploadImage(file);
        editor.focus();
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;
          selection.insertNodes([$createImageNode(src)]);
        });
        toast.success('Image inserted');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Image upload failed.');
      } finally {
        setUploadingImage(false);
        if (imageInputRef.current) imageInputRef.current.value = '';
      }
    },
    [editor, onUploadImage]
  );

  const handleBrowseImage = useCallback(async () => {
    if (!onBrowseImage) return;
    try {
      const src = await onBrowseImage();
      if (!src) return;
      editor.focus();
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        selection.insertNodes([$createImageNode(src)]);
      });
      toast.success('Image inserted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not select an image.');
    }
  }, [editor, onBrowseImage]);

  const applyImageLayout = useCallback(
    (layout: ImageLayout) => {
      if (!selectedImage) return;
      setLayoutOpen(false);
      editor.update(() => {
        const node = $getNodeByKey(selectedImage.key);
        if ($isImageNode(node)) node.setLayout(layout);
      });
      setSelectedImage((prev) => (prev ? { ...prev, layout } : prev));
    },
    [editor, selectedImage]
  );

  return (
    <div className={cn('flex flex-wrap items-center gap-1 px-3 py-2', floating ? 'bg-transparent' : 'rounded-t-lg border-b border-card-border bg-card')}>
      {/* Undo / Redo */}
      <ToolbarButton onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} disabled={!toolbar.canUndo} title="Undo">
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} disabled={!toolbar.canRedo} title="Redo">
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarSep />

      {/* Block format */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setBlockOpen((o) => !o);
          }}
          className="flex h-9 items-center gap-1.5 rounded-btn border border-card-border px-3 text-sm font-medium text-foreground transition-colors hover:border-brand/40"
          aria-haspopup="listbox"
          aria-expanded={blockOpen}
        >
          {blockLabels[toolbar.block]}
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', blockOpen && 'rotate-180')} />
        </button>
        {blockOpen && (
          <>
            <div className="fixed inset-0 z-10" onMouseDown={() => setBlockOpen(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 max-h-72 w-48 overflow-y-auto rounded-lg border border-card-border bg-card py-1 shadow-card-hover">
              {blockOrder.map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyBlock(fmt);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-brand/10',
                    toolbar.block === fmt ? 'text-brand' : 'text-foreground'
                  )}
                >
                  {fmt === 'table' && <TableIcon className="h-3.5 w-3.5" />}
                  {fmt === 'divider' && <Minus className="h-3.5 w-3.5" />}
                  {fmt === 'code' && <Code2 className="h-3.5 w-3.5" />}
                  {fmt === 'bullet' && <List className="h-3.5 w-3.5" />}
                  {fmt === 'number' && <ListOrdered className="h-3.5 w-3.5" />}
                  {fmt === 'check' && <ListChecks className="h-3.5 w-3.5" />}
                  {blockLabels[fmt]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Text colour */}
      <ColorControl
        label="Text colour"
        icon={<Palette className="h-4 w-4" />}
        value={toolbar.textColor}
        onChange={applyTextColor}
      />

      {/* Background colour — applies to the selected table cell(s) when inside
          a table, otherwise to the current paragraph/heading block. */}
      <ColorControl
        label={toolbar.cellCount > 0 ? `Cell background${toolbar.cellCount > 1 ? ` · ${toolbar.cellCount} cells` : ''}` : 'Background colour'}
        icon={<PaintBucket className="h-4 w-4" />}
        value={toolbar.cellCount > 0 ? toolbar.cellBg : toolbar.blockBg}
        onChange={toolbar.cellCount > 0 ? applyCellBackground : applyBlockBackground}
        disabled={toolbar.cellCount === 0 && !['paragraph', 'h1', 'h2', 'h3'].includes(toolbar.block)}
      />

      {/* Font size */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setFontSizeOpen((o) => !o);
          }}
          className="flex h-9 items-center gap-0.5 rounded-btn border border-card-border px-2 text-xs font-medium text-foreground transition-colors hover:border-brand/40"
          aria-haspopup="listbox"
          aria-expanded={fontSizeOpen}
          title="Font size"
        >
          <span className="w-6">{fontSize?.replace('px', '') ?? '16'}</span>
          <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', fontSizeOpen && 'rotate-180')} />
        </button>
        {fontSizeOpen && (
          <>
            <div className="fixed inset-0 z-10" onMouseDown={() => setFontSizeOpen(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 max-h-56 w-20 overflow-y-auto rounded-lg border border-card-border bg-card py-1 shadow-card-hover">
              {FONT_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFontSize(s);
                    setFontSizeOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-center py-1.5 text-center transition-colors hover:bg-brand/10',
                    fontSize?.replace('px', '') === s ? 'text-brand' : 'text-foreground'
                  )}
                  style={{ fontSize: `${s}px`, lineHeight: 1.2 }}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Font family */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setFontFamilyOpen((o) => !o);
          }}
          className="flex h-9 items-center gap-0.5 rounded-btn border border-card-border px-2 text-xs font-medium text-foreground transition-colors hover:border-brand/40"
          aria-haspopup="listbox"
          aria-expanded={fontFamilyOpen}
          title="Font family"
        >
          <span className="max-w-[96px] truncate">{FONT_FAMILIES.find((f) => f.value === fontFamily)?.label ?? 'Font'}</span>
          <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', fontFamilyOpen && 'rotate-180')} />
        </button>
        {fontFamilyOpen && (
          <>
            <div className="fixed inset-0 z-10" onMouseDown={() => setFontFamilyOpen(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-card-border bg-card py-1 shadow-card-hover">
              {FONT_FAMILIES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFontFamily(f.value);
                    setFontFamilyOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors hover:bg-brand/10',
                    fontFamily === f.value ? 'text-brand' : 'text-foreground'
                  )}
                >
                  <span style={{ fontFamily: f.value }}>{f.label.split(' (')[0]}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{f.label.split('(')[1]?.replace(')', '')}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <ToolbarSep />

      {/* Inline formatting */}
      <ToolbarButton onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')} active={toolbar.bold} title="Bold">
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')} active={toolbar.italic} title="Italic">
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')} active={toolbar.underline} title="Underline">
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')} active={toolbar.strikethrough} title="Strikethrough">
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')} active={toolbar.subscript} title="Subscript">
        <Subscript className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')} active={toolbar.superscript} title="Superscript">
        <Superscript className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')} active={toolbar.code} title="Inline code">
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarSep />

      {/* Alignment (cell-aware: applies to every selected table cell) */}
      <ToolbarButton
        onClick={() => (toolbar.cellCount > 0 ? applyCellAlignment('left') : editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left'))}
        title={toolbar.cellCount > 0 ? 'Align cells left' : 'Align left'}
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => (toolbar.cellCount > 0 ? applyCellAlignment('center') : editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center'))}
        title={toolbar.cellCount > 0 ? 'Align cells center' : 'Align center'}
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => (toolbar.cellCount > 0 ? applyCellAlignment('right') : editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right'))}
        title={toolbar.cellCount > 0 ? 'Align cells right' : 'Align right'}
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => (toolbar.cellCount > 0 ? applyCellAlignment('justify') : editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify'))}
        title={toolbar.cellCount > 0 ? 'Justify cells' : 'Justify'}
      >
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>

      {/* Cell selection indicator + vertical alignment */}
      {toolbar.cellCount > 0 && (
        <div className="relative flex items-center gap-1 rounded-btn border border-brand/30 bg-brand/5 px-2 py-1">
          <Grid2X2 className="h-3.5 w-3.5 text-brand" />
          <span className="text-[11px] font-semibold text-brand">
            {toolbar.cellCount === 1 ? '1 cell selected' : `${toolbar.cellCount} cells selected`}
          </span>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setVertOpen((o) => !o);
            }}
            title="Cell vertical alignment"
            aria-label="Cell vertical alignment"
            aria-expanded={vertOpen}
            className="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-brand transition-colors hover:bg-brand/15"
          >
            <AlignVerticalJustifyCenter className="h-3.5 w-3.5" />
          </button>
          {vertOpen && (
            <>
              <div className="fixed inset-0 z-10" onMouseDown={() => setVertOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-card-border bg-card p-1 shadow-card-hover">
                {(
                  [
                    { value: 'top', label: 'Top', Icon: AlignVerticalJustifyStart },
                    { value: 'middle', label: 'Middle', Icon: AlignVerticalJustifyCenter },
                    { value: 'bottom', label: 'Bottom', Icon: AlignVerticalJustifyEnd },
                  ] as const
                ).map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyCellVerticalAlign(value);
                      setVertOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-brand/10"
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <ToolbarSep />

      {/* Indent / Outdent */}
      <ToolbarButton onClick={() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)} title="Indent">
        <Indent className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)} title="Outdent">
        <Outdent className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarSep />

      {/* Link */}
      <div className="relative">
        <ToolbarButton onClick={() => setLinkOpen((o) => !o)} title="Insert link" active={linkOpen}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        {linkOpen && (
          <>
            <div className="fixed inset-0 z-10" onMouseDown={() => setLinkOpen(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 flex w-72 items-center gap-2 rounded-lg border border-card-border bg-card p-2 shadow-card-hover">
              <input
                ref={linkInputRef}
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLink()}
                placeholder="https://…"
                className="h-9 flex-1 rounded-btn border border-card-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleLink}
                className="h-9 rounded-btn bg-brand px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                Apply
              </button>
            </div>
          </>
        )}
      </div>

      {/* Horizontal rule */}
      <ToolbarButton onClick={insertHorizontalRule} title="Horizontal rule">
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      {/* Insert variable */}
      {variables && variables.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setVarOpen((o) => !o);
            }}
            title="Insert variable"
            className="flex h-9 items-center gap-1.5 rounded-btn border border-brand/25 bg-brand/5 px-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
            aria-haspopup="listbox"
            aria-expanded={varOpen}
          >
            <span className="font-mono text-xs">&#123;&#123;var&#125;&#125;</span>
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', varOpen && 'rotate-180')} />
          </button>
          {varOpen && (
            <>
              <div className="fixed inset-0 z-10" onMouseDown={() => setVarOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-56 overflow-y-auto rounded-lg border border-card-border bg-card py-1 shadow-card-hover">
                {variables.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertVariable(name);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 font-mono text-xs text-foreground transition-colors hover:bg-brand/10 hover:text-brand"
                  >
                    {`{{${name}}}`}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Insert image */}
      {(onUploadImage || onBrowseImage) && (
        <>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleImagePick(e.target.files?.[0])}
          />
          <div className="relative">
            <ToolbarButton
              onClick={() => setImageMenuOpen((o) => !o)}
              disabled={uploadingImage}
              title="Insert image"
            >
              {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            </ToolbarButton>
            {imageMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onMouseDown={() => setImageMenuOpen(false)} />
                <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-card-border bg-card py-1 shadow-card-hover">
                  {onUploadImage && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setImageMenuOpen(false);
                        imageInputRef.current?.click();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-brand/10 hover:text-brand"
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload image
                    </button>
                  )}
                  {onBrowseImage && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setImageMenuOpen(false);
                        void handleBrowseImage();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-brand/10 hover:text-brand"
                    >
                      <FolderOpen className="h-3.5 w-3.5" /> Browse storage
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Image layout — appears when an image is selected */}
      {selectedImage && (
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setLayoutOpen((o) => !o);
            }}
            className="flex h-9 items-center gap-1.5 rounded-btn border border-card-border px-3 text-sm font-medium text-foreground transition-colors hover:border-brand/40"
            aria-haspopup="listbox"
            aria-expanded={layoutOpen}
          >
            <ImageIcon className="h-3.5 w-3.5 text-brand" />
            {IMAGE_LAYOUTS.find((l) => l.value === selectedImage.layout)?.label ?? 'Layout'}
            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', layoutOpen && 'rotate-180')} />
          </button>
          {layoutOpen && (
            <>
              <div className="fixed inset-0 z-10" onMouseDown={() => setLayoutOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-card-border bg-card py-1 shadow-card-hover">
                {IMAGE_LAYOUTS.map((layout) => (
                  <button
                    key={layout.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyImageLayout(layout.value);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-brand/10',
                      selectedImage.layout === layout.value ? 'text-brand' : 'text-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        selectedImage.layout === layout.value ? 'bg-brand' : 'bg-card-border'
                      )}
                    />
                    {layout.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Clear formatting */}
      <ToolbarButton onClick={clearFormatting} title="Clear formatting">
        <Eraser className="h-4 w-4" />
      </ToolbarButton>

      <button
        type="button"
        onClick={() => setLinkOpen(false)}
        className="ml-auto hidden text-muted-foreground hover:text-brand sm:block"
        aria-hidden="true"
        tabIndex={-1}
      >
        <X className="h-4 w-4 opacity-0" />
      </button>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  $isTextNode,
  $createParagraphNode,
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
  type TextFormatType,
} from 'lexical';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $createCodeNode, $isCodeNode } from '@lexical/code';
import { $setBlocksType } from '@lexical/selection';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  $isListNode,
} from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $createTableNodeWithDimensions, $isTableNode } from '@lexical/table';
import { $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
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
  Minus,
  MessageSquareQuote,
  Table as TableIcon,
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
} from 'lucide-react';
import { $createCalloutNode, $isCalloutNode } from '../nodes/CalloutNode';
import { $createDividerNode, $isDividerNode } from '../nodes/DividerNode';
import { $createImageNode } from '../nodes/ImageNode';
import { $createVariableNode } from '../nodes/VariableNode';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

export function ToolbarPlugin({
  variables,
  onUploadImage,
  onBrowseImage,
}: {
  variables?: string[];
  onUploadImage?: (file: File) => Promise<string>;
  onBrowseImage?: () => Promise<string | null>;
}) {
  const [editor] = useLexicalComposerContext();
  const [toolbar, setToolbar] = useState<ToolbarState>(initialToolbar);
  const [blockOpen, setBlockOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [varOpen, setVarOpen] = useState(false);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateToolbar = () => {
      editor.getEditorState().read(() => {
        try {
          const selection = $getSelection();
          const hasFormat = (type: TextFormatType) =>
            $isRangeSelection(selection) && selection.hasFormat(type);

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
          }));
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
    });
  }, [editor]);

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

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-card-border bg-card px-3 py-2">
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

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')} title="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')} title="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')} title="Align right">
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')} title="Justify">
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>

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

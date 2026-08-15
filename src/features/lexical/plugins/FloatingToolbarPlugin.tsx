'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $createParagraphNode,
  type ElementNode,
  type TextFormatType,
} from 'lexical';
import { $isCodeNode } from '@lexical/code';
import { $isHeadingNode, $createHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { Bold, Italic, Underline, Strikethrough, Code, Subscript, Superscript, Eraser, Heading2, Pilcrow } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingState {
  x: number;
  y: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  subscript: boolean;
  superscript: boolean;
  inHeading: boolean;
}

/**
 * Playground-style floating toolbar shown while the user selects text.
 * Positioned just above the native selection rect, brand-reskinned.
 */
export function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = useState<FloatingState | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const update = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || selection.isCollapsed()) {
        setState(null);
        return;
      }
      // Do not show inside code blocks.
      const node = selection.anchor.getNode();
      let block: ElementNode | null = null;
      if ($isElementNode(node)) block = node;
      else block = node.getParent() ?? null;
      if (block && $isCodeNode(block)) {
        setState(null);
        return;
      }

      const hasFormat = (t: TextFormatType) => selection.hasFormat(t);

      // Position above the native selection.
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) {
        setState(null);
        return;
      }
      const rect = domSelection.getRangeAt(0).getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setState(null);
        return;
      }

      const inHeading = Boolean(
        block && $isHeadingNode(block)
      );

      setState({
        x: rect.left + rect.width / 2,
        y: rect.top,
        bold: hasFormat('bold'),
        italic: hasFormat('italic'),
        underline: hasFormat('underline'),
        strikethrough: hasFormat('strikethrough'),
        code: hasFormat('code'),
        subscript: hasFormat('subscript'),
        superscript: hasFormat('superscript'),
        inHeading,
      });
    });
  }, [editor]);

  useEffect(() => {
    const unregister = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        update();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
    const unregisterUpdate = editor.registerUpdateListener(() => update());
    const onScroll = () => update();
    window.addEventListener('scroll', onScroll, true);
    return () => {
      unregister();
      unregisterUpdate();
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [editor, update]);

  const fmt = (type: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
    update();
  };

  const toggleHeading = () => {
    editor.focus();
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const node = selection.anchor.getNode();
      let block: ElementNode | null = null;
      if ($isElementNode(node)) block = node;
      else block = node.getParent() ?? null;
      if (block && $isHeadingNode(block)) {
        $setBlocksType(selection, () => $createParagraphNode());
      } else {
        $setBlocksType(selection, () => $createHeadingNode('h2'));
      }
    });
    update();
  };

  const clear = () => {
    editor.focus();
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      selection.getNodes().forEach((n) => {
        if ($isTextNode(n)) {
          n.setFormat(0);
          n.setStyle('');
        }
      });
    });
    update();
  };

  if (!state) return null;

  const Btn = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-colors',
        active ? 'bg-brand/15 text-brand' : 'hover:bg-brand/10 hover:text-brand'
      )}
    >
      {children}
    </button>
  );

  const barWidth = 8 * 36 + 2;

  return (
    <div
      ref={barRef}
      className="pointer-events-none fixed z-[60]"
      style={{ left: state.x - barWidth / 2, top: state.y - 46 }}
    >
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-card-border bg-card p-1 shadow-card-hover">
        <Btn onClick={toggleHeading} active={state.inHeading} title="Toggle heading">
          {state.inHeading ? <Pilcrow className="h-4 w-4" /> : <Heading2 className="h-4 w-4" />}
        </Btn>
        <Btn onClick={() => fmt('bold')} active={state.bold} title="Bold">
          <Bold className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => fmt('italic')} active={state.italic} title="Italic">
          <Italic className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => fmt('underline')} active={state.underline} title="Underline">
          <Underline className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => fmt('strikethrough')} active={state.strikethrough} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => fmt('code')} active={state.code} title="Inline code">
          <Code className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => fmt('subscript')} active={state.subscript} title="Subscript">
          <Subscript className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => fmt('superscript')} active={state.superscript} title="Superscript">
          <Superscript className="h-4 w-4" />
        </Btn>
        <div className="mx-0.5 h-5 w-px bg-card-border" />
        <Btn onClick={clear} title="Clear formatting">
          <Eraser className="h-4 w-4" />
        </Btn>
      </div>
    </div>
  );
}

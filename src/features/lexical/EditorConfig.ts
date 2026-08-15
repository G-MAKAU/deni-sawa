'use client';

import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { MarkNode } from '@lexical/mark';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import type { InitialConfigType } from '@lexical/react/LexicalComposer';
import type { Klass, LexicalNode } from 'lexical';
import { CalloutNode } from './nodes/CalloutNode';
import { DividerNode } from './nodes/DividerNode';
import { ImageNode } from './nodes/ImageNode';
import { VariableNode } from './nodes/VariableNode';
import { LexicalTheme } from './LexicalTheme';

export const NAMESPACE = 'deni-sawa';

export const EDITOR_NODES: Klass<LexicalNode>[] = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  MarkNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HorizontalRuleNode,
  CalloutNode,
  DividerNode,
  ImageNode,
  VariableNode,
];

export interface BuildConfigOptions {
  /** Serialized EditorState JSON (object or stringified) to hydrate the editor. */
  state?: Record<string, unknown> | string;
  editable?: boolean;
}

/** True when the state contains at least one root child (Lexical forbids an empty root). */
function hasContent(state: Record<string, unknown> | string | undefined): boolean {
  if (!state) return false;
  let parsed: unknown = state;
  if (typeof state === 'string') {
    if (!state.trim()) return false;
    try {
      parsed = JSON.parse(state);
    } catch {
      // Invalid JSON — let Lexical attempt the parse so onError can report it.
      return true;
    }
  }
  const root = (parsed as { root?: { children?: unknown[] } } | null)?.root;
  return Array.isArray(root?.children) && root.children.length > 0;
}

/**
 * Shared initial config factory. `state` may be a serialized Lexical
 * EditorState JSON object (as produced by Claude) or a JSON string.
 */
export function buildEditorConfig({
  state,
  editable = true,
}: BuildConfigOptions): InitialConfigType {
  return {
    namespace: NAMESPACE,
    theme: LexicalTheme,
    editable,
    nodes: EDITOR_NODES,
    // Pass the serialized state as a STRING. Lexical's composer parses strings via
    // parseEditorState; the function form calls back with the editor and discards
    // the returned value, so it would leave the editor empty. Empty states are
    // omitted so Lexical boots a default editor instead of throwing on setEditorState.
    editorState: hasContent(state) ? (typeof state === 'string' ? state : JSON.stringify(state)) : undefined,
    onError(error: unknown) {
      // Do not crash the page on malformed states — surface quietly.
      console.error('Lexical editor error:', error);
    },
  };
}

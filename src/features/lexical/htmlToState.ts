'use client';

import { createHeadlessEditor } from '@lexical/headless';
import { $generateNodesFromDOM } from '@lexical/html';
import { $getRoot } from 'lexical';
import { EDITOR_NODES, NAMESPACE } from './EditorConfig';

/**
 * Converts HTML (e.g. an existing blog post's content_html) into a serialized
 * Lexical EditorState so the rich editor can load it. Runs in the browser.
 * Returns null when the HTML cannot be imported — callers start with an empty
 * document in that case.
 */
export async function htmlToLexicalState(html: string): Promise<Record<string, unknown> | null> {
  try {
    const editor = createHeadlessEditor({
      namespace: NAMESPACE,
      nodes: EDITOR_NODES,
      onError: () => {
        /* noop */
      },
    });

    const dom = new DOMParser().parseFromString(html?.trim() || '<p></p>', 'text/html');

    await editor.update(() => {
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      root.append(...nodes);
    });

    return editor.getEditorState().toJSON() as unknown as Record<string, unknown>;
  } catch (error) {
    console.error('htmlToLexicalState failed:', error);
    return null;
  }
}

'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateNodesFromDOM } from '@lexical/html';
import { COMMAND_PRIORITY_HIGH, PASTE_COMMAND, $getSelection, $isRangeSelection } from 'lexical';
import { sanitizePastedHtml } from '@/lib/sanitizePastedHtml';

/**
 * Paste handler that sanitises clipboard HTML before importing it into the
 * editor. The sanitizer strips inline styles, scripts and unknown tags so
 * pasted content renders with the Deni Sawa theme — clean, aligned and
 * on-brand instead of carrying the source site's colours/fonts.
 *
 * Falls back to Lexical's default paste handling when there is no HTML or the
 * import fails.
 */
export function PastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const clipboardData = (event as ClipboardEvent).clipboardData;
        const html = clipboardData?.getData('text/html');
        if (!html) return false;

        try {
          const sanitized = sanitizePastedHtml(html);
          if (!sanitized) return false;

          const dom = new DOMParser().parseFromString(sanitized, 'text/html');

          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            const nodes = $generateNodesFromDOM(editor, dom);
            if (nodes.length > 0) selection.insertNodes(nodes);
          });

          event.preventDefault();
          return true;
        } catch (error) {
          console.error('Paste sanitization failed:', error);
          return false;
        }
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}

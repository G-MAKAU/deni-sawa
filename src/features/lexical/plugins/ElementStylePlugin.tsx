'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isElementNode, type ElementNode } from 'lexical';
import { parseCssProperty } from '@/lib/css-color';

/**
 * Lexical only mirrors TEXT-node styles onto the DOM — element node styles
 * (e.g. a background-color set on a paragraph/heading block) are serialized
 * and exported but never painted on screen. This plugin applies the managed
 * CSS properties from each element node's style string onto its DOM element.
 */
export function ElementStylePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const walk = (node: ElementNode) => {
          const dom = editor.getElementByKey(node.getKey());
          if (dom) {
            const bg = parseCssProperty(node.getStyle(), 'background-color');
            dom.style.backgroundColor = bg ?? '';
          }
          const children = node.getChildren();
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if ($isElementNode(child)) walk(child);
          }
        };

        const root = $getRoot();
        const children = root.getChildren();
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if ($isElementNode(child)) walk(child);
        }
      });
    });
  }, [editor]);

  return null;
}

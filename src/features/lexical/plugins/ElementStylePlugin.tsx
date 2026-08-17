'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isElementNode, type ElementNode, type LexicalNode } from 'lexical';
import { parseCssProperty } from '@/lib/css-color';

type JsonNode = Record<string, unknown>;

/** Block-level CSS props we re-apply from a serialized element `style`. */
const BLOCK_STYLE_PROPS = ['background-color', 'text-align', 'color', 'font-size', 'line-height', 'padding', 'margin', 'border-radius'] as const;

function applySerializedStyle(dom: HTMLElement, style: unknown) {
  if (typeof style !== 'string' || !style) return;
  for (const decl of style.split(';')) {
    const idx = decl.indexOf(':');
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const value = decl.slice(idx + 1).trim();
    if (!value) continue;
    if ((BLOCK_STYLE_PROPS as readonly string[]).includes(prop)) {
      dom.style.setProperty(prop, value);
    }
  }
}

/**
 * Two jobs:
 *  1. Live editor — mirror an element's in-memory `background-color` onto its
 *     DOM (Lexical does not paint element styles itself).
 *  2. Read-only reports — Lexical drops element `style` on import, so re-apply
 *     the serialized block styles (background-color, text-align, color, font-size)
 *     by walking the raw state in lockstep with the live node tree.
 */
export function ElementStylePlugin({ state }: { state?: Record<string, unknown> | string }) {
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
          for (const child of node.getChildren()) {
            if ($isElementNode(child)) walk(child);
          }
        };
        for (const child of $getRoot().getChildren()) {
          if ($isElementNode(child)) walk(child);
        }
      });
    });
  }, [editor]);

  useEffect(() => {
    let raw: JsonNode | null = null;
    if (typeof state === 'string') {
      try {
        raw = JSON.parse(state) as JsonNode;
      } catch {
        raw = null;
      }
    } else {
      raw = (state as JsonNode | undefined) ?? null;
    }
    if (!raw) return;

    const rawChildren = (raw.root as JsonNode | undefined)?.children;
    if (!Array.isArray(rawChildren)) return;

    const apply = (serializedChildren: unknown[], liveChildren: LexicalNode[]) => {
      const n = Math.min(serializedChildren.length, liveChildren.length);
      for (let i = 0; i < n; i++) {
        const s = serializedChildren[i] as JsonNode | undefined;
        const live = liveChildren[i];
        if (!s || !live) continue;
        if ($isElementNode(live)) {
          const dom = editor.getElementByKey(live.getKey());
          if (dom) applySerializedStyle(dom, s.style);
        }
        if (Array.isArray(s.children) && $isElementNode(live)) {
          apply(s.children, live.getChildren());
        }
      }
    };

    let applied = false;
    const runOnce = () => {
      if (applied) return;
      applied = true;
      editor.getEditorState().read(() => {
        apply(rawChildren, $getRoot().getChildren());
      });
    };

    // First update listener fires after the composer hydrates the DOM; the
    // timeout is a safety net for editors whose state is already committed.
    const unregister = editor.registerUpdateListener(runOnce);
    const t = window.setTimeout(runOnce, 50);

    return () => {
      unregister();
      window.clearTimeout(t);
    };
  }, [editor, state]);

  return null;
}

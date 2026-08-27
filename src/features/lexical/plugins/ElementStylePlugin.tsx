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

/** Mirrors a node's model styles onto its live DOM element. Returns false when no DOM exists yet. */
function applyNodeStyles(editor: ReturnType<typeof useLexicalComposerContext>[0], node: ElementNode): boolean {
  const dom = editor.getElementByKey(node.getKey());
  if (!dom) return false;
  const style = node.getStyle();
  let applied = false;
  for (const prop of BLOCK_STYLE_PROPS) {
    const value = parseCssProperty(style, prop);
    if (value) {
      dom.style.setProperty(prop, value);
      applied = true;
    }
  }
  return applied;
}

function walkAll(editor: ReturnType<typeof useLexicalComposerContext>[0], fn: (node: ElementNode) => void) {
  const walk = (node: ElementNode) => {
    fn(node);
    for (const child of node.getChildren()) {
      if ($isElementNode(child)) walk(child);
    }
  };
  for (const child of $getRoot().getChildren()) {
    if ($isElementNode(child)) walk(child);
  }
}

/**
 * Two jobs:
 *  1. Live mirror — keep an element's in-memory block styles (background-color,
 *     text-align, color, font-size, padding, …) in sync with its DOM on every
 *     update (Lexical does not paint element styles itself).
 *  2. Read-only reports — Lexical drops element `style` on import in some
 *     render paths, so re-apply the serialized block styles by walking the raw
 *     state in lockstep with the live node tree, retrying until the DOM exists.
 */
export function ElementStylePlugin({ state }: { state?: Record<string, unknown> | string }) {
  const [editor] = useLexicalComposerContext();

  // Live mirror — runs on every update and once shortly after mount so late
  // reconciliation still gets the styles painted.
  useEffect(() => {
    const sync = () => {
      editor.getEditorState().read(() => {
        walkAll(editor, (node) => {
          applyNodeStyles(editor, node);
        });
      });
    };
    const unregister = editor.registerUpdateListener(sync);
    const t = window.setTimeout(sync, 80);
    return () => {
      unregister();
      window.clearTimeout(t);
    };
  }, [editor]);

  // Rehydration from the raw serialized state, retrying until the live DOM for
  // every element is available so styles are never silently skipped.
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
    const rawChildren = (raw?.root as JsonNode | undefined)?.children;
    if (!raw || !Array.isArray(rawChildren)) return;

    const walk = (serializedChildren: unknown[], liveChildren: LexicalNode[]): boolean => {
      let missing = false;
      const n = Math.min(serializedChildren.length, liveChildren.length);
      for (let i = 0; i < n; i++) {
        const s = serializedChildren[i] as JsonNode | undefined;
        const live = liveChildren[i];
        if (!s || !live) continue;
        if ($isElementNode(live)) {
          const dom = editor.getElementByKey(live.getKey());
          if (dom) {
            applySerializedStyle(dom, s.style);
          } else {
            missing = true;
          }
        }
        if (Array.isArray(s.children) && $isElementNode(live)) {
          const childMissing = walk(s.children, live.getChildren());
          if (childMissing) missing = true;
        }
      }
      return missing;
    };

    let attempts = 0;
    let timer: number | undefined;
    const run = () => {
      let missing = false;
      editor.getEditorState().read(() => {
        missing = walk(rawChildren, $getRoot().getChildren());
      });
      if (missing && attempts < 10) {
        attempts += 1;
        timer = window.setTimeout(run, 80);
      }
    };
    run();

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [editor, state]);

  return null;
}
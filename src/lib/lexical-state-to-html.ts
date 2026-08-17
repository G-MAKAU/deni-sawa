import { JSDOM } from 'jsdom';
import { createHeadlessEditor } from '@lexical/headless';
import { $generateHtmlFromNodes } from '@lexical/html';
import { DecoratorNode, ElementNode, type Klass, type LexicalNode, type SerializedLexicalNode } from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { MarkNode } from '@lexical/mark';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { CalloutNode } from '@/features/lexical/nodes/CalloutNode';
import { DividerNode } from '@/features/lexical/nodes/DividerNode';

type GlobalKey = 'window' | 'document' | 'NodeFilter' | 'MutationObserver' | 'HTMLElement';

/* Server-safe stand-ins for nodes that can't be imported server-side (the app's
   editor config and decorator nodes are client-bound). They only need to
   satisfy parse/serialize/export for HTML generation. */

const NAMESPACE = 'deni-sawa';

class ServerHorizontalRuleNode extends ElementNode {
  static getType(): string {
    return 'horizontalrule';
  }
  static clone(node: ServerHorizontalRuleNode): ServerHorizontalRuleNode {
    return new ServerHorizontalRuleNode(node.__key);
  }
  constructor(key?: string) {
    super(key);
  }
  createDOM(): HTMLElement {
    return document.createElement('hr');
  }
  updateDOM(): boolean {
    return false;
  }
  static importJSON(): ServerHorizontalRuleNode {
    return new ServerHorizontalRuleNode();
  }
  exportJSON(): { children: never[]; direction: null; format: ''; indent: 0; type: 'horizontalrule'; version: 1 } {
    return { children: [], direction: null, format: '', indent: 0, type: 'horizontalrule', version: 1 };
  }
  exportDOM(): { element: HTMLElement } {
    return { element: document.createElement('hr') };
  }
  isTopLevel(): boolean {
    return true;
  }
}

/* Server-safe stand-ins for the client-only decorator nodes. They only need to
   satisfy parse/serialize/export for HTML generation — decorate() is never
   invoked headlessly. */

type ImageLayout = 'inline' | 'square-left' | 'square-right' | 'tight-left' | 'tight-right' | 'center' | 'behind' | 'front';

class ServerImageNode extends DecoratorNode<null> {
  __src: string;
  __alt: string;
  __width: number | null;
  __layout: ImageLayout;

  static getType(): string {
    return 'image';
  }
  static clone(node: ServerImageNode): ServerImageNode {
    return new ServerImageNode(node.__src, node.__alt, node.__width, node.__layout, node.__key);
  }
  constructor(src: string, alt = '', width: number | null = null, layout: ImageLayout = 'inline', key?: string) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__width = width;
    this.__layout = layout;
  }
  createDOM(): HTMLElement {
    return document.createElement('span');
  }
  updateDOM(): boolean {
    return false;
  }
  isInline(): boolean {
    return true;
  }
  decorate(): null {
    return null;
  }
  static importJSON(serialized: SerializedLexicalNode & Record<string, unknown>): ServerImageNode {
    return new ServerImageNode(
      String(serialized.src ?? ''),
      String(serialized.alt ?? ''),
      typeof serialized.width === 'number' ? serialized.width : null,
      (serialized.layout as ImageLayout) ?? 'inline'
    );
  }
  exportJSON(): SerializedImageNode {
    return { alt: this.__alt, src: this.__src, width: this.__width, layout: this.__layout, type: 'image', version: 1 };
  }
  exportDOM(): { element: HTMLElement } {
    const img = document.createElement('img');
    img.src = this.__src;
    img.alt = this.__alt;
    if (this.__width) {
      img.setAttribute('width', String(this.__width));
      img.style.width = `${this.__width}px`;
    }
    const layoutStyle: Record<ImageLayout, string> = {
      inline: '',
      'square-left': 'float:left;margin-right:1rem;',
      'square-right': 'float:right;margin-left:1rem;',
      'tight-left': 'float:left;margin-right:1rem;',
      'tight-right': 'float:right;margin-left:1rem;',
      center: 'display:block;margin:0.5rem auto;',
      behind: 'position:absolute;z-index:0;pointer-events:none;',
      front: 'position:absolute;z-index:10;',
    };
    img.style.cssText = `${img.style.cssText}${layoutStyle[this.__layout]}`;
    return { element: img };
  }
  getTextContent(): string {
    return '';
  }
}
type SerializedImageNode = { alt: string; src: string; width: number | null; layout: ImageLayout } & SerializedLexicalNode;

class ServerVariableNode extends DecoratorNode<null> {
  __name: string;
  static getType(): string {
    return 'variable';
  }
  static clone(node: ServerVariableNode): ServerVariableNode {
    return new ServerVariableNode(node.__name, node.__key);
  }
  constructor(name: string, key?: string) {
    super(key);
    this.__name = name;
  }
  createDOM(): HTMLElement {
    return document.createElement('span');
  }
  updateDOM(): boolean {
    return false;
  }
  isInline(): boolean {
    return true;
  }
  decorate(): null {
    return null;
  }
  static importJSON(serialized: SerializedLexicalNode & Record<string, unknown>): ServerVariableNode {
    return new ServerVariableNode(String(serialized.name ?? ''));
  }
  exportJSON(): { name: string } & SerializedLexicalNode {
    return { name: this.__name, type: 'variable', version: 1 };
  }
  exportDOM(): { element: HTMLElement } {
    const span = document.createElement('span');
    span.setAttribute('data-variable', this.__name);
    span.textContent = `{{${this.__name}}}`;
    return { element: span };
  }
  getTextContent(): string {
    return '';
  }
}

export const SERVER_NODES: Klass<LexicalNode>[] = [  HeadingNode,
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
  ServerHorizontalRuleNode,
  CalloutNode,
  DividerNode,
  ServerImageNode,
  ServerVariableNode,
];

/**
 * Lossless Lexical → HTML conversion for server-side use (API routes).
 *
 * Uses Lexical's official HTML serializer (`$generateHtmlFromNodes`) through a
 * headless editor backed by a temporary jsdom document, so EVERY node the
 * editor can produce — including tables, images and custom nodes — serializes
 * faithfully. This is the source of truth for `blog_posts.content_html`.
 *
 * This module must only be imported by server code: it pulls in jsdom.
 */
export function lexicalStateToHtml(state: Record<string, unknown> | string): string {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const { window } = dom;

  const saved = new Map<GlobalKey, unknown>([
    ['window', (globalThis as Record<string, unknown>).window],
    ['document', (globalThis as Record<string, unknown>).document],
    ['NodeFilter', (globalThis as Record<string, unknown>).NodeFilter],
    ['MutationObserver', (globalThis as Record<string, unknown>).MutationObserver],
    ['HTMLElement', (globalThis as Record<string, unknown>).HTMLElement],
  ]);

  try {
    (globalThis as Record<string, unknown>).window = window;
    (globalThis as Record<string, unknown>).document = window.document;
    (globalThis as Record<string, unknown>).NodeFilter = window.NodeFilter;
    (globalThis as Record<string, unknown>).MutationObserver = window.MutationObserver;
    (globalThis as Record<string, unknown>).HTMLElement = window.HTMLElement;

    const editor = createHeadlessEditor({
      namespace: NAMESPACE,
      nodes: SERVER_NODES,
      onError: () => {
        /* surface silently — the caller falls back if generation throws */
      },
    });

    const json = typeof state === 'string' ? state : JSON.stringify(state);
    editor.setEditorState(editor.parseEditorState(json));

    return editor.read(() => $generateHtmlFromNodes(editor));
  } finally {
    for (const [key, value] of saved) (globalThis as Record<string, unknown>)[key] = value;
    dom.window.close();
  }
}

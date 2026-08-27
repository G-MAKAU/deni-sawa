import {
  $applyNodeReplacement,
  ElementNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
} from 'lexical';

export type SerializedPageBreakNode = SerializedElementNode;

/**
 * Custom block node — a page break marker. Renders a dashed rule labelled
 * "Page Break" (a visual break; PDF/Word exports treat it as a divider).
 */
export class PageBreakNode extends ElementNode {
  static getType(): string {
    return 'pagebreak';
  }

  static clone(node: PageBreakNode): PageBreakNode {
    return new PageBreakNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  createDOM(_config: EditorConfig, _editor: unknown): HTMLElement {
    const element = document.createElement('div');
    element.className = 'ds-page-break';
    element.setAttribute('contenteditable', 'false');
    const label = document.createElement('span');
    label.textContent = 'Page Break';
    element.appendChild(label);
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  isInline(): boolean {
    return false;
  }

  isTopLevel(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return true;
  }

  static importDOM(): null {
    return null;
  }

  static importJSON(_serializedNode: SerializedPageBreakNode): PageBreakNode {
    return $createPageBreakNode();
  }

  exportJSON(): SerializedPageBreakNode {
    return {
      ...super.exportJSON(),
      type: 'pagebreak',
      version: 1,
    };
  }
}

export function $createPageBreakNode(): PageBreakNode {
  return $applyNodeReplacement(new PageBreakNode());
}

export function $isPageBreakNode(node: LexicalNode | null | undefined): node is PageBreakNode {
  return node instanceof PageBreakNode;
}
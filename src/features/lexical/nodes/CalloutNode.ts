import {
  $applyNodeReplacement,
  ElementNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
} from 'lexical';

export type SerializedCalloutNode = Spread<
  {
    tone?: 'brand' | 'growth' | 'dark';
  },
  SerializedElementNode
>;

/**
 * Custom block node — a branded callout panel used by AI-generated reports
 * for the top-priority findings and recommendations.
 */
export class CalloutNode extends ElementNode {
  __tone: 'brand' | 'growth' | 'dark';

  static getType(): string {
    return 'callout';
  }

  static clone(node: CalloutNode): CalloutNode {
    return new CalloutNode(node.__tone, node.__key);
  }

  constructor(tone: 'brand' | 'growth' | 'dark' = 'brand', key?: NodeKey) {
    super(key);
    this.__tone = tone;
  }

  createDOM(_config: EditorConfig, _editor: unknown): HTMLElement {
    const element = document.createElement('div');
    element.className = `ds-callout ds-callout--${this.__tone}`;
    return element;
  }

  updateDOM(prevNode: CalloutNode): boolean {
    return prevNode.__tone !== this.__tone;
  }

  isInline(): boolean {
    return false;
  }

  isTopLevel(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }

  static importDOM(): null {
    return null;
  }

  static importJSON(serializedNode: SerializedCalloutNode): CalloutNode {
    const node = $createCalloutNode(serializedNode.tone);
    return node;
  }

  exportJSON(): SerializedCalloutNode {
    return {
      ...super.exportJSON(),
      type: 'callout',
      tone: this.__tone,
      version: 1,
    };
  }
}

export function $createCalloutNode(tone: 'brand' | 'growth' | 'dark' = 'brand'): CalloutNode {
  return $applyNodeReplacement(new CalloutNode(tone));
}

export function $isCalloutNode(node: LexicalNode | null | undefined): node is CalloutNode {
  return node instanceof CalloutNode;
}

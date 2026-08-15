import {
  $applyNodeReplacement,
  ElementNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
} from 'lexical';

export type SerializedDividerNode = SerializedElementNode;

/**
 * Custom block node — a full-width horizontal divider used to separate
 * major sections of an AI-generated report.
 */
export class DividerNode extends ElementNode {
  static getType(): string {
    return 'divider';
  }

  static clone(node: DividerNode): DividerNode {
    return new DividerNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  createDOM(_config: EditorConfig, _editor: unknown): HTMLElement {
    const element = document.createElement('hr');
    element.className = 'ds-divider';
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

  static importJSON(serializedNode: SerializedDividerNode): DividerNode {
    const node = $createDividerNode();
    return node;
  }

  exportJSON(): SerializedDividerNode {
    return {
      ...super.exportJSON(),
      type: 'divider',
      version: 1,
    };
  }
}

export function $createDividerNode(): DividerNode {
  return $applyNodeReplacement(new DividerNode());
}

export function $isDividerNode(node: LexicalNode | null | undefined): node is DividerNode {
  return node instanceof DividerNode;
}

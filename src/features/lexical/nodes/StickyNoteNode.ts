import {
  $applyNodeReplacement,
  ElementNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
} from 'lexical';

export type StickyNoteColor = 'yellow' | 'green' | 'blue';

export type SerializedStickyNoteNode = Spread<
  {
    color?: StickyNoteColor;
  },
  SerializedElementNode
>;

/**
 * Custom block node — a sticky-note style block with a taped look and an
 * accent colour. Holds regular text children, so you can type inside it.
 */
export class StickyNoteNode extends ElementNode {
  __color: StickyNoteColor;

  static getType(): string {
    return 'stickynote';
  }

  static clone(node: StickyNoteNode): StickyNoteNode {
    return new StickyNoteNode(node.__color, node.__key);
  }

  constructor(color: StickyNoteColor = 'yellow', key?: NodeKey) {
    super(key);
    this.__color = color;
  }

  createDOM(_config: EditorConfig, _editor: unknown): HTMLElement {
    const element = document.createElement('div');
    element.className = `ds-sticky-note ds-sticky-note--${this.__color}`;
    return element;
  }

  updateDOM(prevNode: StickyNoteNode): boolean {
    return prevNode.__color !== this.__color;
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

  static importJSON(serializedNode: SerializedStickyNoteNode): StickyNoteNode {
    return $createStickyNoteNode(serializedNode.color);
  }

  exportJSON(): SerializedStickyNoteNode {
    return {
      ...super.exportJSON(),
      type: 'stickynote',
      color: this.__color,
      version: 1,
    };
  }
}

export function $createStickyNoteNode(color: StickyNoteColor = 'yellow'): StickyNoteNode {
  return $applyNodeReplacement(new StickyNoteNode(color));
}

export function $isStickyNoteNode(node: LexicalNode | null | undefined): node is StickyNoteNode {
  return node instanceof StickyNoteNode;
}
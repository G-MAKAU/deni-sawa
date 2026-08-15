'use client';

import type { ReactNode } from 'react';
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { DecoratorNode } from 'lexical';

export type SerializedImageNode = Spread<
  { alt: string; src: string; type: 'image'; version: 1 },
  SerializedLexicalNode
>;

function ImageNodeComponent({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="ds-lexical-image">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
    </span>
  );
}

/**
 * Inline decorator image node used by the blog editor. Renders an <img>, keeps
 * its source in the serialized state and exports to `<img>` for HTML.
 */
export class ImageNode extends DecoratorNode<ReactNode> {
  __src: string;
  __alt: string;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__alt, node.__key);
  }

  constructor(src: string, alt = '', key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    return document.createElement('span');
  }

  updateDOM(): boolean {
    return false;
  }

  isInline(): boolean {
    return true;
  }

  decorate(): ReactNode {
    return <ImageNodeComponent src={this.__src} alt={this.__alt} />;
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement('img');
    img.src = this.__src;
    img.alt = this.__alt;
    return { element: img };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode(serializedNode.src, serializedNode.alt);
  }

  exportJSON(): SerializedImageNode {
    return {
      alt: this.__alt,
      src: this.__src,
      type: 'image',
      version: 1,
    };
  }

  getTextContent(): string {
    return '';
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: HTMLElement) => ({
        conversion: (): DOMConversionOutput => {
          const img = node as HTMLImageElement;
          return { node: $createImageNode(img.src, img.alt ?? '') };
        },
        priority: 1,
      }),
    };
  }
}

export function $createImageNode(src: string, alt = ''): ImageNode {
  return new ImageNode(src, alt);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

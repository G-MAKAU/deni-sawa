'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
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
import { DecoratorNode, $createNodeSelection, $getNodeByKey, $getSelection, $isNodeSelection, $setSelection } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ImageResizer } from './ImageResizer';

export type ImageLayout =
  | 'inline'
  | 'square-left'
  | 'square-right'
  | 'tight-left'
  | 'tight-right'
  | 'center'
  | 'behind'
  | 'front';

export type SerializedImageNode = Spread<
  { alt: string; src: string; width: number | null; layout: ImageLayout; type: 'image'; version: 1 },
  SerializedLexicalNode
>;

/**
 * Editor-aware image decorator. In editable editors it shows a hover ring and,
 * once selected, 4-corner resize handles (dragging keeps aspect ratio via a
 * width-only node). In read-only renderers (reports) the stored width/layout
 * are applied but no handles are shown.
 */
function ImageNodeComponent({
  src,
  alt,
  width,
  layout,
  nodeKey,
}: {
  src: string;
  alt: string;
  width: number | null;
  layout: ImageLayout;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [selected, setSelected] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const unregister = editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        setSelected($isNodeSelection(selection) && selection.has(nodeKey));
      });
    });
    return unregister;
  }, [editor, nodeKey]);

  const editable = editor.isEditable();

  return (
    <span
      data-layout={layout}
      className={
        'ds-lexical-image' +
        (selected ? ' ds-img-selected' : hovered && editable ? ' ds-img-hover' : '')
      }
      style={{ ['--img-src' as string]: `url("${src}")` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={(e) => {
        if (!editable) return;
        // Stop the editor root handlers from turning our NodeSelection back
        // into a caret (which made the resize border flash in and out).
        e.preventDefault();
        e.stopPropagation();
        editor.update(() => {
          const nodeSelection = $createNodeSelection();
          nodeSelection.add(nodeKey);
          $setSelection(nodeSelection);
        });
      }}
      onClick={(e) => {
        if (!editable) return;
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseUp={(e) => {
        if (!editable) return;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{ width: width ? `${width}px` : undefined, maxWidth: '100%' }}
      />
      {editable && selected && (
        <ImageResizer
          editor={editor}
          width={width}
          minWidth={60}
          onWidthChange={(w) =>
            editor.update(() => {
              const node = $getNodeByKey(nodeKey);
              if ($isImageNode(node)) node.setWidth(w);
            })
          }
        />
      )}
    </span>
  );
}

/**
 * Inline decorator image node used by the editors. Stores its source, an
 * optional pixel width (null = natural size) and a layout mode, keeps them in
 * the serialized state and exports to `<img>` for HTML.
 */
export class ImageNode extends DecoratorNode<ReactNode> {
  __src: string;
  __alt: string;
  __width: number | null;
  __layout: ImageLayout;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__alt, node.__width, node.__layout, node.__key);
  }

  constructor(src: string, alt = '', width: number | null = null, layout: ImageLayout = 'inline', key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__width = width;
    this.__layout = layout;
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

  getWidth(): number | null {
    return this.__width;
  }

  setWidth(width: number | null): void {
    const self = this.getWritable();
    self.__width = width;
  }

  getLayout(): ImageLayout {
    return this.__layout;
  }

  setLayout(layout: ImageLayout): void {
    const self = this.getWritable();
    self.__layout = layout;
  }

  decorate(): ReactNode {
    return (
      <ImageNodeComponent src={this.__src} alt={this.__alt} width={this.__width} layout={this.__layout} nodeKey={this.getKey()} />
    );
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement('img');
    img.src = this.__src;
    img.alt = this.__alt;
    if (this.__width) {
      img.setAttribute('width', String(this.__width));
      img.style.width = `${this.__width}px`;
    }
    const layoutStyle = LAYOUT_EXPORT_STYLES[this.__layout];
    if (layoutStyle) img.style.cssText = `${img.style.cssText}${layoutStyle}`;
    return { element: img };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode(serializedNode.src, serializedNode.alt, serializedNode.width ?? null, serializedNode.layout ?? 'inline');
  }

  exportJSON(): SerializedImageNode {
    return {
      alt: this.__alt,
      src: this.__src,
      width: this.__width,
      layout: this.__layout,
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
          const w = img.getAttribute('width') ? Number(img.getAttribute('width')) : null;
          return { node: $createImageNode(img.src, img.alt ?? '', w) };
        },
        priority: 1,
      }),
    };
  }
}

export function $createImageNode(src: string, alt = '', width: number | null = null, layout: ImageLayout = 'inline'): ImageNode {
  return new ImageNode(src, alt, width, layout);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

/** Inline styles applied to the exported `<img>` for each layout. */
const LAYOUT_EXPORT_STYLES: Record<ImageLayout, string> = {
  inline: '',
  'square-left': 'float:left;margin-right:1rem;',
  'square-right': 'float:right;margin-left:1rem;',
  'tight-left': 'float:left;margin-right:1rem;',
  'tight-right': 'float:right;margin-left:1rem;',
  center: 'display:block;margin:0.5rem auto;',
  behind: 'position:absolute;z-index:0;pointer-events:none;',
  front: 'position:absolute;z-index:10;',
};

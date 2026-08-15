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
import { VariablePill } from './VariablePill';

export type SerializedVariableNode = Spread<
  { name: string; type: 'variable'; version: 1 },
  SerializedLexicalNode
>;

/**
 * Inline decorator pill for {{variable}} placeholders. Being a DecoratorNode it
 * is atomic: the caret can never enter it and Backspace/Delete removes the whole
 * pill. It serialises to `{{name}}` on HTML / plain-text export so the email
 * template engine can substitute values.
 */
export class VariableNode extends DecoratorNode<ReactNode> {
  __name: string;

  constructor(name: string, key?: NodeKey) {
    super(key);
    this.__name = name;
  }

  static getType(): string {
    return 'variable';
  }

  static clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__name, node.__key);
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

  isIsolated(): boolean {
    return true;
  }

  decorate(): ReactNode {
    return <VariablePill name={this.__name} />;
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span');
    span.setAttribute('data-variable', this.__name);
    span.textContent = `{{${this.__name}}}`;
    return { element: span };
  }

  static importJSON(serializedNode: SerializedVariableNode): VariableNode {
    return $createVariableNode(serializedNode.name);
  }

  exportJSON(): SerializedVariableNode {
    return {
      name: this.__name,
      type: 'variable',
      version: 1,
    };
  }

  getTextContent(): string {
    return `{{${this.__name}}}`;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (node: HTMLElement) => {
        const name = node.getAttribute('data-variable');
        if (!name) return null;
        return {
          conversion: (): DOMConversionOutput => ({ node: $createVariableNode(name) }),
          priority: 1,
        };
      },
    };
  }
}

export function $createVariableNode(name: string): VariableNode {
  return new VariableNode(name);
}

export function $isVariableNode(node: LexicalNode | null | undefined): node is VariableNode {
  return node instanceof VariableNode;
}

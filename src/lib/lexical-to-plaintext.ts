/**
 * Converts a serialized Lexical EditorState (object or JSON string) into plain
 * text. Used to store the admin-edited prompt as `system_prompt` on save.
 * DOM-free walker — no headless editor required.
 */

type JsonNode = Record<string, unknown>;

function childrenOf(node: JsonNode | undefined): JsonNode[] {
  const children = node?.children;
  return Array.isArray(children) ? (children as JsonNode[]) : [];
}

function nodeToText(node: JsonNode): string {
  const type = typeof node.type === 'string' ? node.type : '';

  switch (type) {
    case 'root':
    case 'paragraph':
      return childrenOf(node).map(nodeToText).join('') + '\n';
    case 'heading':
      return childrenOf(node).map(nodeToText).join('') + '\n';
    case 'quote':
      return '> ' + childrenOf(node).map(nodeToText).join('') + '\n';
    case 'list':
      return childrenOf(node).map(nodeToText).join('');
    case 'listitem':
      return '• ' + childrenOf(node).map(nodeToText).join('') + '\n';
    case 'link':
      return childrenOf(node).map(nodeToText).join('');
    case 'text':
      return typeof node.text === 'string' ? node.text : '';
    case 'variable': {
      const name = typeof node.name === 'string' ? node.name : '';
      return `{{${name}}}`;
    }
    case 'image':
      return '';
    case 'callout':
      return childrenOf(node).map(nodeToText).join('') + '\n';
    case 'divider':
    case 'horizontalrule':
      return '\n';
    case 'code':
      return childrenOf(node).map(nodeToText).join('') + '\n';
    case 'linebreak':
      return '\n';
    case 'tab':
      return '\t';
    default: {
      if (typeof node.text === 'string') return node.text;
      return childrenOf(node).map(nodeToText).join('');
    }
  }
}

/**
 * Converts a serialized Lexical EditorState (object or JSON string) into plain
 * text. Safe for server-side use (no DOM, no headless editor).
 */
export function lexicalToPlainText(state: Record<string, unknown> | string): string {
  try {
    const json = typeof state === 'string' ? (JSON.parse(state) as JsonNode) : state;
    const root = (json.root as JsonNode | undefined) ?? json;
    return nodeToText(root).replace(/\n{3,}/g, '\n\n').trim();
  } catch (error) {
    console.error('lexicalToPlainText failed:', error);
    if (typeof state === 'string') return state;
    return '';
  }
}

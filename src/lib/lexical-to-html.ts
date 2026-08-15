/**
 * Converts a serialized Lexical EditorState (object or JSON string) into HTML.
 *
 * This is a DOM-free, dependency-free walker — it does NOT rely on the headless
 * editor or `$generateHtmlFromNodes` (which requires a browser DOM in this
 * Lexical version). It understands the node shapes this app produces/edits:
 * paragraphs, headings, quotes, lists, links, text formats, callouts, dividers
 * and {{variable}} pills.
 */

type JsonNode = Record<string, unknown>;

// Lexical text format bitmask.
const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKETHROUGH = 8;
const FORMAT_UNDERLINE = 4;
const FORMAT_CODE = 16;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function childrenOf(node: JsonNode | undefined): JsonNode[] {
  const children = node?.children;
  return Array.isArray(children) ? (children as JsonNode[]) : [];
}

function formatInlineText(text: string, format: number): string {
  let out = escapeHtml(text);
  if (format & FORMAT_CODE) out = `<code>${out}</code>`;
  if (format & FORMAT_BOLD) out = `<strong>${out}</strong>`;
  if (format & FORMAT_ITALIC) out = `<em>${out}</em>`;
  if (format & FORMAT_UNDERLINE) out = `<u>${out}</u>`;
  if (format & FORMAT_STRIKETHROUGH) out = `<s>${out}</s>`;
  return out;
}

function nodeToHtml(node: JsonNode, isListItemChild = false): string {
  const type = typeof node.type === 'string' ? node.type : '';

  switch (type) {
    case 'root':
      return childrenOf(node).map((child) => nodeToHtml(child)).join('');
    case 'paragraph':
      return `<p>${childrenOf(node).map((child) => nodeToHtml(child)).join('')}</p>`;
    case 'heading': {
      const tag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(String(node.tag)) ? String(node.tag) : 'h2';
      return `<${tag}>${childrenOf(node).map((child) => nodeToHtml(child)).join('')}</${tag}>`;
    }
    case 'quote':
      return `<blockquote>${childrenOf(node).map((child) => nodeToHtml(child)).join('')}</blockquote>`;
    case 'list': {
      const listType = node.listType === 'number' || node.tag === 'ol' ? 'ol' : node.listType === 'check' ? 'ul' : 'ul';
      const items = childrenOf(node).map((child) => {
        const inner = nodeToHtml(child);
        return `<li>${inner}</li>`;
      });
      return `<${listType}>${items.join('')}</${listType}>`;
    }
    case 'listitem':
      return childrenOf(node).map((child) => nodeToHtml(child, true)).join('');
    case 'link': {
      const url = typeof node.url === 'string' ? node.url : '#';
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${childrenOf(node).map((child) => nodeToHtml(child)).join('')}</a>`;
    }
    case 'text': {
      if (typeof node.text === 'string') {
        return formatInlineText(node.text, typeof node.format === 'number' ? node.format : 0);
      }
      return '';
    }
    case 'variable': {
      // Keep the literal token so the email template engine can substitute it.
      const name = typeof node.name === 'string' ? node.name : '';
      return `{{${name}}}`;
    }
    case 'image': {
      const src = typeof node.src === 'string' ? node.src : '';
      const alt = typeof node.alt === 'string' ? node.alt : '';
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`;
    }
    case 'callout': {
      const tone = node.tone === 'growth' || node.tone === 'dark' ? String(node.tone) : 'brand';
      return `<div class="ds-callout ds-callout--${tone}">${childrenOf(node).map((child) => nodeToHtml(child)).join('')}</div>`;
    }
    case 'divider':
    case 'horizontalrule':
      return '<hr />';
    case 'code': {
      const inner = childrenOf(node).map((child) => nodeToHtml(child)).join('');
      return `<pre><code>${inner}</code></pre>`;
    }
    case 'linebreak':
      return '<br />';
    case 'tab':
      return '\t';
    default: {
      // Fallback: any unknown inline/leaf node renders its text or children.
      if (typeof node.text === 'string') return escapeHtml(node.text);
      const children = childrenOf(node);
      if (children.length > 0) return children.map((child) => nodeToHtml(child)).join('');
      return '';
    }
  }
}

/**
 * Converts a serialized Lexical EditorState (object or JSON string) into HTML.
 * Safe for server-side use (no DOM, no headless editor).
 */
export function lexicalToHtml(state: Record<string, unknown> | string): string {
  try {
    const json = typeof state === 'string' ? (JSON.parse(state) as JsonNode) : state;
    const root = (json.root as JsonNode | undefined) ?? json;
    return nodeToHtml(root);
  } catch (error) {
    console.error('lexicalToHtml failed:', error);
    return '';
  }
}

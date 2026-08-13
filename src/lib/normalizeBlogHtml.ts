import sanitizeHtml, { type Transformer } from 'sanitize-html';

/**
 * Sanitizes and normalizes the HTML produced by the Lexical-style editor before
 * it is persisted to `blog_posts.content_html`. Mirrors the Horizon Spire
 * backend so the frontend can safely render `content_html` with innerHTML.
 */
export function normalizeBlogHtml(html: unknown): string | null {
  if (typeof html !== 'string') {
    return null;
  }

  const trimmed = html.trim();

  if (!trimmed || trimmed === '<p><br></p>' || trimmed === '<p><br></p><p><br></p>') {
    return null;
  }

  const transformAnchor: Transformer = (tagName, attribs) => {
    const href = typeof attribs.href === 'string' ? attribs.href : '';
    const target = attribs.target === '_blank' ? '_blank' : undefined;

    const nextAttribs: Record<string, string> = {};
    if (href) nextAttribs.href = href;
    if (target) {
      nextAttribs.target = target;
      nextAttribs.rel = 'noopener noreferrer';
    }

    return { tagName, attribs: nextAttribs };
  };

  const sanitized = sanitizeHtml(trimmed, {
    allowedTags: [
      'p', 'br', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'pre', 'code',
      'ul', 'ol', 'li', 'a', 'hr', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'strong', 'em', 'u', 's',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt'],
      ul: ['data-checklist'],
      li: ['data-checked'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      b: 'strong',
      i: 'em',
      strike: 's',
      font: () => ({ tagName: 'span', attribs: {} }),
      a: transformAnchor,
    },
  });

  const withCodeBlocks = sanitized.replace(
    /<pre>([\s\S]*?)<\/pre>/gi,
    (fullMatch: string, innerHtml: string) => {
      if (/^\s*<code[\s>]/i.test(innerHtml)) {
        return fullMatch;
      }
      return `<pre><code>${innerHtml}</code></pre>`;
    }
  );

  return withCodeBlocks;
}
'use client';

const ALLOWED_TAGS = new Set([
  'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
  'ul', 'ol', 'li', 'a', 'hr', 'img', 'input', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'strong', 'em', 'u', 's',
]);

const ALLOWED_SCHEMES = ['http:', 'https:', 'mailto:'];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return ALLOWED_SCHEMES.includes(parsed.protocol);
  } catch {
    return false;
  }
}

function appendSanitizedChildren(source: Node, target: DocumentFragment | HTMLElement): void {
  source.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(child.textContent ?? ''));
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = child as HTMLElement;
    const rawTagName = element.tagName.toLowerCase();
    const tagName =
      rawTagName === 'b' ? 'strong' : rawTagName === 'i' ? 'em' : rawTagName === 'strike' ? 's' : rawTagName;

    if (!ALLOWED_TAGS.has(tagName)) {
      appendSanitizedChildren(element, target);
      return;
    }

    const nextElement = document.createElement(tagName);

    if (tagName === 'a') {
      const href = element.getAttribute('href') ?? '';
      if (href && isAllowedUrl(href)) {
        nextElement.setAttribute('href', href);
      }
      if (element.getAttribute('target') === '_blank') {
        nextElement.setAttribute('target', '_blank');
        nextElement.setAttribute('rel', 'noopener noreferrer');
      }
    }

    if (tagName === 'img') {
      const src = element.getAttribute('src') ?? '';
      if (!src || !isAllowedUrl(src)) {
        return;
      }
      nextElement.setAttribute('src', src);
      const alt = element.getAttribute('alt');
      if (alt) {
        nextElement.setAttribute('alt', alt);
      }
    }

    if (tagName === 'input') {
      const type = (element.getAttribute('type') ?? '').toLowerCase();
      if (type !== 'checkbox') {
        return;
      }
      nextElement.setAttribute('type', 'checkbox');
      if (element.hasAttribute('checked')) {
        nextElement.setAttribute('checked', '');
      }
    }

    if (tagName === 'ul' && element.getAttribute('data-checklist') === 'true') {
      nextElement.setAttribute('data-checklist', 'true');
    }

    if (tagName === 'li' && element.getAttribute('data-checked') === 'true') {
      nextElement.setAttribute('data-checked', 'true');
    }

    appendSanitizedChildren(element, nextElement);
    target.appendChild(nextElement);
  });
}

export function sanitizePastedHtml(html: string): string | null {
  const trimmed = html.trim();
  if (!trimmed) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__paste_root__">${trimmed}</div>`, 'text/html');
  const root = doc.getElementById('__paste_root__');
  if (!root) return null;

  const fragment = document.createDocumentFragment();
  appendSanitizedChildren(root, fragment);

  const container = document.createElement('div');
  container.appendChild(fragment);

  const sanitized = container.innerHTML.trim();
  if (!sanitized || sanitized === '<p><br></p>') {
    return null;
  }

  return sanitized.replace(/<pre>([\s\S]*?)<\/pre>/gi, (fullMatch: string, innerHtml: string) => {
    if (/^\s*<code[\s>]/i.test(innerHtml)) {
      return fullMatch;
    }
    return `<pre><code>${innerHtml}</code></pre>`;
  });
}

/**
 * Shared CSS colour helpers used by the Lexical toolbar (client) and the
 * PDF/Word report exporters (server) so text colour and block background
 * colors set in the editor survive export.
 */

/** Normalises a CSS colour value into `#rrggbb` (or null when not parseable). */
export function cssColorToHex(value: string): string | null {
  const v = (value ?? '').trim().toLowerCase();
  if (!v) return null;

  // #rgb / #rrggbb / #rrggbbaa
  if (v.startsWith('#')) {
    let hex = v.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    if (hex.length === 6) return `#${hex}`;
    if (hex.length === 8) return `#${hex.slice(0, 6)}`;
    return null;
  }

  // rgb(r, g, b) / rgba(r, g, b, a)
  const rgb = /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/.exec(v);
  if (rgb) {
    const toHex = (n: string) =>
      Math.min(255, Math.max(0, Math.round(Number(n))))
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}`;
  }

  return null;
}

/** Extracts the value of a single CSS property from a `prop: value;` style string. */
export function parseCssProperty(style: string, prop: string): string | null {
  if (!style) return null;
  const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s*:\\s*([^;]+)`).exec(style);
  return match ? match[1].trim() : null;
}

/** Sets (or removes when value is null) a CSS property, preserving the rest. */
export function setCssProperty(style: string, prop: string, value: string | null): string {
  const entries: Array<{ key: string; val: string }> = [];
  (style ?? '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => {
      const idx = s.indexOf(':');
      if (idx <= 0) return;
      const key = s.slice(0, idx).trim().toLowerCase();
      const val = s.slice(idx + 1).trim();
      if (key && val) entries.push({ key, val });
    });

  const filtered = entries.filter((e) => e.key !== prop);
  if (value) filtered.push({ key: prop, val: value });
  return filtered.map((e) => `${e.key}: ${e.val}`).join('; ');
}

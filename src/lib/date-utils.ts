const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Lightweight date formatter replacing date-fns `format()`.
 * Supports: d, dd, MMM, MMMM, yyyy, HH, mm, PP (Sep 19, 2026)
 *
 * Uses a left-to-right scanner to avoid replace-chain collisions
 * (e.g. MMM→"Mar" then M→"3" corrupting the result).
 */
export function formatDate(date: Date | string | number, pattern: string = 'PP'): string {
  let year: number;
  let month: number;
  let day: number;
  let hours: number;
  let minutes: number;

  if (date instanceof Date) {
    year = date.getUTCFullYear();
    month = date.getUTCMonth();
    day = date.getUTCDate();
    hours = date.getUTCHours();
    minutes = date.getUTCMinutes();
  } else if (typeof date === 'string') {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
    if (match) {
      year = parseInt(match[1]);
      month = parseInt(match[2]) - 1;
      day = parseInt(match[3]);
      hours = match[4] ? parseInt(match[4]) : 0;
      minutes = match[5] ? parseInt(match[5]) : 0;
    } else {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      year = d.getUTCFullYear();
      month = d.getUTCMonth();
      day = d.getUTCDate();
      hours = d.getUTCHours();
      minutes = d.getUTCMinutes();
    }
  } else {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    year = d.getUTCFullYear();
    month = d.getUTCMonth();
    day = d.getUTCDate();
    hours = d.getUTCHours();
    minutes = d.getUTCMinutes();
  }

  // PP = "MMM d, yyyy" (e.g. Sep 19, 2026)
  if (pattern === 'PP') {
    return `${MONTHS_SHORT[month]} ${day}, ${year}`;
  }

  // Left-to-right scanner: always match longest token first
  let out = '';
  let i = 0;
  while (i < pattern.length) {
    if (pattern.slice(i, i + 4) === 'yyyy') { out += year; i += 4; continue; }
    if (pattern.slice(i, i + 4) === 'MMMM') { out += MONTHS_LONG[month]; i += 4; continue; }
    if (pattern.slice(i, i + 3) === 'MMM')  { out += MONTHS_SHORT[month]; i += 3; continue; }
    if (pattern.slice(i, i + 2) === 'MM')   { out += pad(month + 1); i += 2; continue; }
    if (pattern[i] === 'M' && (i + 1 >= pattern.length || pattern[i + 1] !== 'M')) {
      out += month + 1; i++; continue;
    }
    if (pattern.slice(i, i + 2) === 'dd')   { out += pad(day); i += 2; continue; }
    if (pattern[i] === 'd' && (i + 1 >= pattern.length || pattern[i + 1] !== 'd')) {
      out += day; i++; continue;
    }
    if (pattern.slice(i, i + 2) === 'HH')   { out += pad(hours); i += 2; continue; }
    if (pattern.slice(i, i + 2) === 'mm')   { out += pad(minutes); i += 2; continue; }
    out += pattern[i];
    i++;
  }

  return out;
}

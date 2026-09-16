const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Lightweight date formatter replacing date-fns `format()`.
 * Supports: d, dd, MMM, MMMM, yyyy, HH, mm
 */
export function formatDate(date: Date | string | number, pattern: string): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();

  return pattern
    .replace(/yyyy/g, `${year}`)
    .replace(/MMMM/g, MONTHS_LONG[month])
    .replace(/MMM/g, MONTHS_SHORT[month])
    .replace(/dd/g, pad(day))
    .replace(/d/g, `${day}`)
    .replace(/HH/g, pad(hours))
    .replace(/mm/g, pad(minutes));
}

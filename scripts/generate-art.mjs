import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'images', 'art');
mkdirSync(OUT, { recursive: true });

const ORANGE = '#E8510A';
const GREEN = '#5A9E28';
const CHARCOAL = '#1A1A1A';
const DEEP = '#0F0F0F';
const CARD = '#222222';
const OFFWHITE = '#F9F7F5';

const MONO = `'JetBrains Mono', Menlo, monospace`;
const DISPLAY = `'Playfair Display', Georgia, serif`;

/** Shared document shell: deep charcoal bg, fine dot grid, vignette. */
function shell(body, { label, bg = DEEP } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="1" stop-color="${CHARCOAL}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.62">
      <stop offset="0" stop-color="${ORANGE}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${ORANGE}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowGreen" cx="0.5" cy="0.42" r="0.62">
      <stop offset="0" stop-color="${GREEN}" stop-opacity="0.14"/>
      <stop offset="1" stop-color="${GREEN}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="44" height="44" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.4" fill="#ffffff" opacity="0.05"/>
    </pattern>
    <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${ORANGE}"/>
      <stop offset="1" stop-color="${GREEN}"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg)"/>
  <rect width="1600" height="1000" fill="url(#glow)"/>
  <rect width="1600" height="1000" fill="url(#dots)"/>
  <rect width="1600" height="1000" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="1.5"/>
  <g transform="translate(80 88)">
    <text x="0" y="0" font-family="${MONO}" font-size="22" letter-spacing="6" fill="#ffffff" opacity="0.55" text-transform="uppercase">${label}</text>
    <rect x="0" y="14" width="64" height="3" fill="url(#strokeGrad)"/>
  </g>
  ${body}
  <text x="80" y="940" font-family="${MONO}" font-size="18" letter-spacing="4" fill="#ffffff" opacity="0.28">DENI SAWA PARTNERS · WWW.DENISAWA.CO.KE</text>
</svg>`;
}

const pieces = {
  'art-diagnose': {
    label: 'DS / 01 — Diagnose',
    body: `
  <g transform="translate(800 500)">
    <circle cx="0" cy="0" r="340" fill="none" stroke="${ORANGE}" stroke-width="2" opacity="0.2"/>
    <circle cx="0" cy="0" r="252" fill="none" stroke="${ORANGE}" stroke-width="2" opacity="0.35"/>
    <circle cx="0" cy="0" r="168" fill="none" stroke="${ORANGE}" stroke-width="2.5" opacity="0.6"/>
    <circle cx="0" cy="0" r="96" fill="${ORANGE}" opacity="0.12"/>
    <circle cx="0" cy="0" r="34" fill="${ORANGE}"/>
    <circle cx="0" cy="0" r="14" fill="${OFFWHITE}"/>
    <g stroke="${GREEN}" stroke-width="2" opacity="0.5">
      <line x1="-470" y1="-300" x2="-220" y2="-140"/>
      <line x1="-470" y1="-180" x2="-240" y2="-60"/>
      <line x1="-470" y1="-60" x2="-260" y2="20"/>
      <line x1="-470" y1="60" x2="-300" y2="80"/>
    </g>
  </g>`,
  },
  'art-cashflow': {
    label: 'DS / 02 — Cashflow',
    body: `
  <g transform="translate(160 560)">
    <g fill="none" stroke-width="3" stroke-linecap="round" opacity="0.18">
      <path d="M0 0 C 240 -140, 520 -140, 720 0 S 1240 140, 1440 0" stroke="${GREEN}"/>
      <path d="M0 34 C 240 -106, 520 -106, 720 34 S 1240 174, 1440 34" stroke="${GREEN}"/>
      <path d="M0 68 C 240 -72, 520 -72, 720 68 S 1240 208, 1440 68" stroke="${GREEN}"/>
    </g>
    <path d="M0 0 C 240 -140, 520 -140, 720 0 S 1240 140, 1440 0" fill="none" stroke="url(#strokeGrad)" stroke-width="6" stroke-linecap="round"/>
    <circle cx="720" cy="0" r="14" fill="${ORANGE}"/>
    <g transform="translate(0 -40)">
      ${Array.from({ length: 8 }, (_, i) => {
        const h = 40 + Math.abs(Math.sin(i * 1.7)) * 150;
        return `<rect x="${i * 200}" y="${-h}" width="72" height="${h}" fill="${i % 2 ? GREEN : ORANGE}" opacity="${0.25 + (i / 14)}" rx="6"/>`;
      }).join('\n      ')}
    </g>
  </g>`,
  },
  'art-governance': {
    label: 'DS / 03 — Governance',
    body: `
  <g transform="translate(800 520)">
    <rect x="-330" y="-330" width="660" height="660" fill="none" stroke="${ORANGE}" stroke-width="2" opacity="0.15"/>
    <rect x="-250" y="-250" width="500" height="500" fill="none" stroke="${ORANGE}" stroke-width="2" opacity="0.3"/>
    <rect x="-168" y="-168" width="336" height="336" fill="none" stroke="url(#strokeGrad)" stroke-width="3"/>
    <rect x="-168" y="-168" width="336" height="336" fill="${ORANGE}" opacity="0.07"/>
    <g stroke="${GREEN}" stroke-width="2" opacity="0.55">
      <line x1="-168" y1="0" x2="168" y2="0"/>
      <line x1="0" y1="-168" x2="0" y2="168"/>
    </g>
    <circle cx="0" cy="0" r="26" fill="${ORANGE}"/>
    <g transform="translate(-330 470)">
      ${[0, 1, 2, 3].map((i) => `<rect x="${i * 190}" y="${-40 - i * 22}" width="150" height="${40 + i * 22}" fill="none" stroke="${i % 2 ? ORANGE : GREEN}" stroke-width="2.5" opacity="0.5" rx="4"/>`).join('\n      ')}
    </g>
  </g>`,
  },
  'art-growth': {
    label: 'DS / 04 — Growth',
    body: `
  <g transform="translate(240 700)">
    <g>
      ${Array.from({ length: 7 }, (_, i) => {
        const h = 90 + i * 52;
        return `<rect x="${i * 168}" y="${-h}" width="92" height="${h}" rx="8" fill="${i === 6 ? ORANGE : '#ffffff'}" opacity="${0.08 + i * 0.09}" stroke="${i === 6 ? ORANGE : '#ffffff'}" stroke-opacity="0.25"/>`;
      }).join('\n      ')}
    </g>
    <path d="M84 -140 L 252 -230 L 420 -310 L 588 -410 L 756 -470 L 924 -560 L 1092 -660" fill="none" stroke="url(#strokeGrad)" stroke-width="7" stroke-linecap="round"/>
    <circle cx="1092" cy="-660" r="18" fill="${ORANGE}"/>
    <circle cx="1092" cy="-660" r="34" fill="none" stroke="${ORANGE}" stroke-width="2.5" opacity="0.4"/>
  </g>`,
  },
  'art-network': {
    label: 'DS / 05 — Network',
    body: `
  <g transform="translate(800 500)">
    <g stroke="${GREEN}" stroke-width="2.5" opacity="0.4">
      <line x1="-260" y1="120" x2="60" y2="-140"/>
      <line x1="-260" y1="120" x2="220" y2="40"/>
      <line x1="-260" y1="120" x2="120" y2="220"/>
      <line x1="60" y1="-140" x2="220" y2="40"/>
      <line x1="60" y1="-140" x2="120" y2="220"/>
      <line x1="220" y1="40" x2="120" y2="220"/>
      <line x1="-260" y1="120" x2="0" y2="0"/>
      <line x1="60" y1="-140" x2="0" y2="0"/>
      <line x1="120" y1="220" x2="0" y2="0"/>
    </g>
    <circle cx="0" cy="0" r="34" fill="${ORANGE}"/>
    <g>
      <circle cx="-260" cy="120" r="22" fill="#111" stroke="${ORANGE}" stroke-width="3"/>
      <circle cx="60" cy="-140" r="22" fill="#111" stroke="${ORANGE}" stroke-width="3"/>
      <circle cx="220" cy="40" r="22" fill="#111" stroke="${ORANGE}" stroke-width="3"/>
      <circle cx="120" cy="220" r="22" fill="#111" stroke="${ORANGE}" stroke-width="3"/>
    </g>
    <g fill="${GREEN}">
      ${Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        const x = Math.cos(a) * 420;
        const y = Math.sin(a) * 330;
        return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="10" opacity="0.7"/>`;
      }).join('\n      ')}
    </g>
  </g>`,
  },
  'art-implement': {
    label: 'DS / 06 — Implement',
    body: `
  <g transform="translate(120 640)">
    <g>
      ${Array.from({ length: 8 }, (_, i) => {
        const w = 150 + i * 22;
        return `<rect x="0" y="${-36 - i * 64}" width="${w}" height="48" rx="6" fill="none" stroke="${i === 7 ? ORANGE : '#ffffff'}" stroke-width="2.5" opacity="${0.3 + i * 0.08}" stroke-opacity="${i === 7 ? 1 : 0.4}"/>`;
      }).join('\n      ')}
    </g>
    <circle cx="${150 + 7 * 22 + 60}" cy="${-36 - 7 * 64 + 24}" r="16" fill="${ORANGE}"/>
    <g transform="translate(500 -120)">
      ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${i * 130}" cy="${i % 2 ? -30 : 30}" r="20" fill="#111" stroke="${GREEN}" stroke-width="2.5" opacity="0.8"/>`).join('\n      ')}
    </g>
  </g>`,
  },
  'art-sustain': {
    label: 'DS / 07 — Sustain',
    body: `
  <g transform="translate(800 480)">
    <circle cx="0" cy="0" r="360" fill="none" stroke="${GREEN}" stroke-width="2" opacity="0.15"/>
    <circle cx="0" cy="0" r="300" fill="none" stroke="${GREEN}" stroke-width="2" opacity="0.25"/>
    <path d="M -260 0 A 260 260 0 1 1 260 0" fill="none" stroke="url(#strokeGrad)" stroke-width="7" stroke-linecap="round"/>
    <path d="M 260 0 A 260 260 0 1 1 -260 0" fill="none" stroke="${ORANGE}" stroke-width="3" stroke-dasharray="6 18" stroke-linecap="round" opacity="0.5"/>
    <circle cx="260" cy="0" r="20" fill="${ORANGE}"/>
    <g transform="translate(0 340)">
      <path d="M -180 0 C -60 -60, 60 60, 180 0" fill="none" stroke="${GREEN}" stroke-width="4" opacity="0.7"/>
      <circle cx="-180" cy="0" r="8" fill="${GREEN}"/>
      <circle cx="180" cy="0" r="8" fill="${GREEN}"/>
    </g>
  </g>`,
  },
  'art-learning': {
    label: 'DS / 08 — Learning',
    body: `
  <g transform="translate(800 470)">
    <g transform="rotate(-6 0 0)">
      <rect x="-320" y="-200" width="640" height="120" rx="10" fill="${ORANGE}" opacity="0.08" stroke="${ORANGE}" stroke-width="2.5"/>
      <rect x="-340" y="-120" width="680" height="120" rx="10" fill="#111" stroke="${GREEN}" stroke-width="2.5"/>
      <rect x="-360" y="-40" width="720" height="120" rx="10" fill="#111" stroke="${ORANGE}" stroke-width="2.5"/>
      <rect x="-300" y="40" width="600" height="80" rx="8" fill="${GREEN}" opacity="0.35"/>
    </g>
    <g transform="translate(-360 300)" font-family="${DISPLAY}" font-size="150" fill="${OFFWHITE}" opacity="0.9">
      <text x="0" y="0">A</text>
    </g>
  </g>`,
  },
  'art-investors': {
    label: 'DS / 09 — Investors',
    body: `
  <g transform="translate(780 500)">
    <circle cx="0" cy="0" r="330" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2"/>
    <path d="M 0 -330 A 330 330 0 0 1 285.8 165 L 0 0 Z" fill="${ORANGE}" opacity="0.8"/>
    <path d="M 285.8 165 A 330 330 0 0 1 -285.8 165 L 0 0 Z" fill="${GREEN}" opacity="0.55"/>
    <path d="M -285.8 165 A 330 330 0 0 1 0 -330 L 0 0 Z" fill="#ffffff" opacity="0.06"/>
    <circle cx="0" cy="0" r="70" fill="#111" stroke="${ORANGE}" stroke-width="3"/>
    <text x="0" y="14" text-anchor="middle" font-family="${MONO}" font-size="30" fill="${OFFWHITE}">BIC</text>
    <g transform="translate(0 420)">
      <path d="M -260 0 L 260 0" stroke="#ffffff" stroke-opacity="0.2" stroke-width="2"/>
      ${Array.from({ length: 5 }, (_, i) => `<circle cx="${i * 130 - 260}" cy="${i % 2 ? -34 : -16}" r="9" fill="${i === 4 ? ORANGE : GREEN}"/>`).join('\n      ')}
    </g>
  </g>`,
  },
  'art-leadership': {
    label: 'DS / 10 — Leadership',
    body: `
  <g transform="translate(800 480)">
    <polygon points="0,-360 340,240 -340,240" fill="none" stroke="${ORANGE}" stroke-width="2.5" opacity="0.25"/>
    <polygon points="0,-300 284,200 -284,200" fill="none" stroke="${GREEN}" stroke-width="2.5" opacity="0.4"/>
    <polygon points="0,-240 228,160 -228,160" fill="${ORANGE}" opacity="0.08" stroke="url(#strokeGrad)" stroke-width="3"/>
    <circle cx="0" cy="30" r="86" fill="none" stroke="${ORANGE}" stroke-width="2.5" opacity="0.5"/>
    <circle cx="0" cy="30" r="34" fill="${ORANGE}"/>
    <g transform="translate(-330 400)" font-family="${DISPLAY}" font-size="110" fill="${OFFWHITE}" opacity="0.35">
      <text x="0" y="0">Lead.</text>
    </g>
  </g>`,
  },
  'art-resilience': {
    label: 'DS / 11 — Resilience',
    body: `
  <g transform="translate(140 520)">
    <path d="M0 0 L180 -200 L360 0 L540 -140 L720 40 L900 -120 L1080 80 L1260 -40 L1440 60" fill="none" stroke="url(#strokeGrad)" stroke-width="6" stroke-linecap="round"/>
    <g fill="none" stroke="${GREEN}" stroke-width="2.5" opacity="0.3">
      <path d="M0 60 L180 -140 L360 60 L540 -80 L720 100 L900 -60 L1080 140 L1260 -20 L1440 120"/>
      <path d="M0 120 L180 -80 L360 120 L540 -20 L720 160 L900 0 L1080 200 L1260 40 L1440 180"/>
    </g>
    <circle cx="180" cy="-200" r="16" fill="${ORANGE}"/>
    <circle cx="540" cy="-140" r="16" fill="${ORANGE}"/>
    <circle cx="900" cy="-120" r="16" fill="${ORANGE}"/>
    <circle cx="1260" cy="-40" r="16" fill="${ORANGE}"/>
  </g>`,
  },
  'art-advisory': {
    label: 'DS / 12 — Advisory',
    body: `
  <g transform="translate(120 220)">
    <g stroke="#ffffff" stroke-opacity="0.14" stroke-width="1.5">
      ${Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${i * 70}" x2="1360" y2="${i * 70}"/>`).join('\n      ')}
      ${Array.from({ length: 15 }, (_, i) => `<line x1="${i * 97}" y1="0" x2="${i * 97}" y2="560"/>`).join('\n      ')}
    </g>
    <g transform="translate(0 0)">
      <path d="M 0 320 L 320 120 L 700 260 L 1000 60 L 1360 180" fill="none" stroke="${ORANGE}" stroke-width="7" stroke-linecap="round"/>
      <g>
        ${[0, 320, 700, 1000, 1360].map((x, i) => {
          const y = [320, 120, 260, 60, 180][i];
          return `<circle cx="${x}" cy="${y}" r="16" fill="${i === 3 ? ORANGE : '#111'}" stroke="${i === 3 ? ORANGE : GREEN}" stroke-width="3"/>`;
        }).join('\n        ')}
      </g>
    </g>
    <g transform="translate(600 640)">
      <rect x="-340" y="0" width="680" height="130" rx="12" fill="${ORANGE}" opacity="0.07" stroke="${ORANGE}" stroke-width="2"/>
      <text x="0" y="78" text-anchor="middle" font-family="${MONO}" font-size="40" letter-spacing="8" fill="${OFFWHITE}" opacity="0.85">SPECIAL SITUATIONS</text>
    </g>
  </g>`,
  },
  'art-negotiate': {
    label: 'DS / 13 — Negotiate',
    body: `
  <g transform="translate(800 480)">
    <circle cx="-150" cy="0" r="250" fill="none" stroke="${ORANGE}" stroke-width="3" opacity="0.5"/>
    <circle cx="150" cy="0" r="250" fill="none" stroke="${GREEN}" stroke-width="3" opacity="0.5"/>
    <circle cx="-150" cy="0" r="250" fill="${ORANGE}" opacity="0.07"/>
    <circle cx="150" cy="0" r="250" fill="${GREEN}" opacity="0.07"/>
    <circle cx="0" cy="0" r="150" fill="#111" stroke="url(#strokeGrad)" stroke-width="3.5"/>
    <text x="0" y="12" text-anchor="middle" font-family="${MONO}" font-size="26" letter-spacing="4" fill="${OFFWHITE}">WIN · WIN</text>
    <g transform="translate(-330 360)">
      ${['Landers', 'Creditors', 'Founders', 'Investors'].map((w, i) => `<text x="0" y="${i * 42}" font-family="${MONO}" font-size="22" letter-spacing="3" fill="#ffffff" opacity="0.35">${i + 1}. ${w}</text>`).join('\n      ')}
    </g>
  </g>`,
  },
};

const entries = Object.entries(pieces);
let count = 0;
for (const [name, { label, body }] of entries) {
  const svg = shell(body, { label });
  writeFileSync(join(OUT, `${name}.svg`), svg);
  count++;
}
console.log(`Generated ${count} SVG art assets -> ${OUT}`);

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = path.join(__dirname, '../public/images')

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

const images = [
  // ── HOMEPAGE ──────────────────────────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=3840&q=95',
    filename: 'hero-homepage.webp',
    width: 3840,
  },
  {
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&q=90',
    filename: 'audience-professionals.webp',
    width: 1200,
  },
  {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=90',
    filename: 'audience-entrepreneurs.webp',
    width: 1200,
  },
  {
    url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&q=90',
    filename: 'audience-investors.webp',
    width: 1200,
  },

  // ── SERVICES PAGES ────────────────────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=3840&q=95',
    filename: 'hero-services.webp',
    width: 3840,
  },
  {
    url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=3840&q=95',
    filename: 'hero-professionals.webp',
    width: 3840,
  },
  {
    url: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=3840&q=95',
    filename: 'hero-entrepreneurs.webp',
    width: 3840,
  },
  {
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=3840&q=95',
    filename: 'hero-investors.webp',
    width: 3840,
  },
  {
    url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=3840&q=95',
    filename: 'hero-learning.webp',
    width: 3840,
  },

  // ── HEALTH CHECKS PAGE ────────────────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=2400&q=90',
    filename: 'hero-health-checks.webp',
    width: 2400,
  },
  {
    url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=90',
    filename: 'check-business.webp',
    width: 1200,
  },
  {
    url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=90',
    filename: 'check-professional.webp',
    width: 1200,
  },

  // ── ABOUT PAGE ────────────────────────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=3840&q=95',
    filename: 'hero-about.webp',
    width: 3840,
  },
  {
    url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=2400&q=90',
    filename: 'about-philosophy.webp',
    width: 2400,
  },

  // ── THE METHOD PAGE ───────────────────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=2400&q=90',
    filename: 'hero-method.webp',
    width: 2400,
  },

  // ── CONTACT PAGE ─────────────────────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1551836022-4af4a7a66b8a?w=2400&q=90',
    filename: 'hero-contact.webp',
    width: 2400,
  },

  // ── INSIGHTS / BLOG ───────────────────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=85',
    filename: 'blog-default-cover.webp',
    width: 1200,
  },
  {
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&q=85',
    filename: 'blog-financial-health.webp',
    width: 1200,
  },
  {
    url: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=1200&q=85',
    filename: 'blog-governance.webp',
    width: 1200,
  },
  {
    url: 'https://images.unsplash.com/photo-1533073526757-2c8ca1df9f1c?w=1200&q=85',
    filename: 'blog-recovery.webp',
    width: 1200,
  },

  // ── OG / SOCIAL ───────────────────────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=90',
    filename: 'og-background.webp',
    width: 1200,
  },
]

async function downloadAndConvert({ url, filename, width }) {
  const outPath = path.join(OUTPUT_DIR, filename)
  if (fs.existsSync(outPath)) {
    console.log(`⏭  Skipped (exists): ${filename}`)
    return
  }
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    await sharp(buffer)
      .resize(width, null, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(outPath)
    const meta = await sharp(outPath).metadata()
    console.log(`✓ Downloaded: ${filename} (${meta.width}×${meta.height})`)
  } catch (err) {
    console.error(`✗ Failed: ${filename} — ${err.message}`)
  }
}

console.log(`Downloading ${images.length} images to ${OUTPUT_DIR}...\n`)

for (const img of images) {
  await downloadAndConvert(img)
}

console.log('\nDone.')

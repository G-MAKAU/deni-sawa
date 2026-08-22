DENI SAWA PARTNERS — PREMIUM PHOTOGRAPHY IMPLEMENTATION PROMPT

You are working on the Deni Sawa Partners Next.js 14 codebase. This prompt covers sourcing, downloading, and implementing a complete premium photography set for the entire website. The firm is based in Nairobi, Kenya. All images must reflect a professional African business context — not generic Western stock photography. No handshakes, no laptop-on-desk clichés, no fake smiling teams.

CURRENT IMAGE AUDIT

From scanning the live site, the following images are currently in use:

File	Location	Current description	Verdict
/images/hero-1.jpg	Homepage hero	"Deni Sawa Partners concluding a business advisory agreement"	Replace — unknown quality, generic description
/Deni-sawa-main-logo.webp	Nav + footer	Brand logo	Keep — do not touch

Everything else is text-only or CSS-based. The site is significantly under-illustrated for a premium advisory firm. The following pages need photography added:

Homepage (hero, audience sections, insights)
/services hub
/services/professionals
/services/entrepreneurs
/services/investors
/services/learning
/health-checks
/about
/contact
IMAGE SPECIFICATION — FULL SET

All images must be:

WebP format after download and conversion
High resolution — minimum 1920px wide for hero images, 1200px for cards, 800px for thumbnails
Free licence — Unsplash or Pexels only (both are free for commercial use, no attribution required)
African business context — Black African professionals in real business settings where possible. Nairobi, modern office environments, boardrooms, outdoor business districts
No AI-generated imagery — real photography only
No watermarks — only fully free images
Saved to /public/images/ with the exact filenames specified below
DOWNLOAD SCRIPT

Write a Node.js script at /scripts/download-images.mjs that:

Defines an array of image objects with url, filename, and description
Uses fetch() to download each image
Converts each to WebP using the sharp npm package (sharp must be installed: npm install sharp)
Saves to /public/images/[filename].webp
Logs progress: ✓ Downloaded: hero-homepage.webp (1920×1080)
Handles errors gracefully — if one download fails, log the error and continue with the rest
Skips files that already exist (do not re-download)
javascript
// /scripts/download-images.mjs
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = path.join(__dirname, '../public/images')

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

const images = [
  // --- paste the image array below ---
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
    console.log(`✓ Downloaded: ${filename}`)
  } catch (err) {
    console.error(`✗ Failed: ${filename} — ${err.message}`)
  }
}

for (const img of images) {
  await downloadAndConvert(img)
}
IMAGE ARRAY — EXACT URLS AND FILENAMES

Use these exact Unsplash and Pexels direct download URLs. Each URL is the full-resolution direct download link.

javascript
const images = [

  // ── HOMEPAGE ──────────────────────────────────────────────────────

  {
    // Hero: Confident senior African business professional at a large
    // glass-walled office overlooking Nairobi CBD. Strong, authoritative.
    // Shot from slightly below, natural light, premium feel.
    url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=3840&q=95',
    filename: 'hero-homepage.webp',
    width: 3840,
    alt: 'Senior business advisor in a modern Nairobi office',
    usage: 'Homepage hero — full width, dark overlay 50%'
  },
  {
    // Who We Serve — Professionals: Professional African woman at desk,
    // reviewing financial documents, calm and focused. Premium office.
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&q=90',
    filename: 'audience-professionals.webp',
    width: 1200,
    alt: 'Professional reviewing personal financial documents',
    usage: 'Who We Serve — Professionals & Individuals card'
  },
  {
    // Who We Serve — Entrepreneurs: African male founder in a modern
    // co-working or startup space, standing, looking ahead confidently.
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=90',
    filename: 'audience-entrepreneurs.webp',
    width: 1200,
    alt: 'Entrepreneur and founder in a modern business environment',
    usage: 'Who We Serve — Entrepreneurs & Founders card'
  },
  {
    // Who We Serve — Investors: Two professionals in a boardroom,
    // one presenting data on a screen, one listening. Premium setting.
    url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&q=90',
    filename: 'audience-investors.webp',
    width: 1200,
    alt: 'Investors reviewing portfolio data in a boardroom',
    usage: 'Who We Serve — Investors card'
  },

  // ── SERVICES PAGES ────────────────────────────────────────────────

  {
    // Services hub hero: Wide shot of modern Nairobi skyline or CBD
    // glass building exterior, golden hour. Premium, aspirational.
    url: 'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=3840&q=95',
    filename: 'hero-services.webp',
    width: 3840,
    alt: 'Modern business district representing premium advisory services',
    usage: 'Services hub page hero'
  },
  {
    // Professionals page hero: African professional woman walking
    // confidently through a modern office corridor, business attire,
    // natural light, shallow depth of field.
    url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=3840&q=95',
    filename: 'hero-professionals.webp',
    width: 3840,
    alt: 'Professional woman in a modern office environment',
    usage: 'Professionals & Individuals page hero'
  },
  {
    // Entrepreneurs page hero: African male founder at a whiteboard,
    // mapping out a business strategy. Energy and focus. Modern space.
    url: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=3840&q=95',
    filename: 'hero-entrepreneurs.webp',
    width: 3840,
    alt: 'Founder planning business strategy at a modern workspace',
    usage: 'Entrepreneurs & Founders page hero'
  },
  {
    // Investors page hero: Elevated view of financial data on screens,
    // hands reviewing documents on a glass conference table. Premium.
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=3840&q=95',
    filename: 'hero-investors.webp',
    width: 3840,
    alt: 'Investor reviewing portfolio performance data',
    usage: 'Investors page hero'
  },
  {
    // Learning page hero: Group of diverse African professionals in a
    // learning session, presenter at front, engaged audience. Premium venue.
    url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=3840&q=95',
    filename: 'hero-learning.webp',
    width: 3840,
    alt: 'Professionals in an executive learning and development session',
    usage: 'Learning & Programs page hero'
  },

  // ── HEALTH CHECKS PAGE ────────────────────────────────────────────

  {
    // Health Checks hero: Clean, calm image of a professional sitting
    // at a minimal desk with a tablet or screen, focused assessment mood.
    // Light, airy, trustworthy feel. Not clinical — professional.
    url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=2400&q=90',
    filename: 'hero-health-checks.webp',
    width: 2400,
    alt: 'Professional completing a structured business assessment',
    usage: 'Health Checks page hero — max 320px height on desktop'
  },
  {
    // Business Health Check card image: African male executive reviewing
    // financial reports with charts visible. Boardroom or office setting.
    url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=90',
    filename: 'check-business.webp',
    width: 1200,
    alt: 'Business executive reviewing financial health data',
    usage: 'Business Health Check card — both homepage and health-checks page'
  },
  {
    // Professional Financial Health Check card: African woman reviewing
    // personal finance documents at home or in a professional setting.
    // Calm, composed, aspirational.
    url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=90',
    filename: 'check-professional.webp',
    width: 1200,
    alt: 'Professional reviewing personal financial health documents',
    usage: 'Professional Financial Health Check card'
  },

  // ── ABOUT PAGE ────────────────────────────────────────────────────

  {
    // About hero: Premium portrait-style shot or team in a boardroom.
    // Warm, trustworthy, authoritative. Nairobi setting strongly preferred.
    url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=3840&q=95',
    filename: 'hero-about.webp',
    width: 3840,
    alt: 'Deni Sawa Partners advisory team in a professional setting',
    usage: 'About page hero'
  },
  {
    // Philosophy / Values section: Sunrise or early morning light through
    // office window, Nairobi view in background. Aspirational, calm.
    url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=2400&q=90',
    filename: 'about-philosophy.webp',
    width: 2400,
    alt: 'Nairobi city view representing vision and purpose',
    usage: 'About — Philosophy section'
  },

  // ── THE METHOD PAGE ───────────────────────────────────────────────

  {
    // Method page: Structured, methodical image. Hands writing on a
    // notepad with a structured framework visible. Precise, professional.
    url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=2400&q=90',
    filename: 'hero-method.webp',
    width: 2400,
    alt: 'Structured planning and methodology in action',
    usage: 'Deni Sawa Method page hero'
  },

  // ── CONTACT PAGE ─────────────────────────────────────────────────

  {
    // Contact page: Warm, approachable image. Professional conversation
    // across a table, not a handshake — two people engaged in discussion.
    url: 'https://images.unsplash.com/photo-1551836022-4af4a7a66b8a?w=2400&q=90',
    filename: 'hero-contact.webp',
    width: 2400,
    alt: 'Two professionals in a focused advisory conversation',
    usage: 'Contact page — alongside the form'
  },

  // ── INSIGHTS / BLOG ───────────────────────────────────────────────

  {
    // Blog default cover — used when a post has no cover image.
    // Clean, typographic-friendly image. Dark with texture or gradient.
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=85',
    filename: 'blog-default-cover.webp',
    width: 1200,
    alt: 'Deni Sawa Partners — Insights and perspectives',
    usage: 'Blog post default cover image when cover_image_url is NULL'
  },
  {
    // Blog category: Financial Health
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&q=85',
    filename: 'blog-financial-health.webp',
    width: 1200,
    alt: 'Financial health and planning',
    usage: 'Blog — Financial Health category header'
  },
  {
    // Blog category: Governance
    url: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=1200&q=85',
    filename: 'blog-governance.webp',
    width: 1200,
    alt: 'Business governance and accountability',
    usage: 'Blog — Governance category header'
  },
  {
    // Blog category: Business Recovery
    url: 'https://images.unsplash.com/photo-1533073526757-2c8ca1df9f1c?w=1200&q=85',
    filename: 'blog-recovery.webp',
    width: 1200,
    alt: 'Business recovery and resilience',
    usage: 'Blog — Business Recovery category header'
  },

  // ── OG / SOCIAL ───────────────────────────────────────────────────

  {
    // OG image background — used in opengraph-image.tsx
    // Dark, premium, brand-coloured. Will have text overlaid.
    url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=90',
    filename: 'og-background.webp',
    width: 1200,
    alt: 'Deni Sawa Partners',
    usage: 'OG image background in opengraph-image.tsx'
  }

]
IMPLEMENTATION IN CODE

After the download script runs successfully, implement each image across the codebase as follows. Use Next.js <Image> component throughout — never <img> tags.

Homepage hero
tsx
// Replace current hero-1.jpg implementation
<Image
  src="/images/hero-homepage.webp"
  alt="Senior business advisor in a modern Nairobi office"
  fill
  priority
  quality={90}
  className="object-cover object-center"
  sizes="100vw"
/>
// Dark overlay: absolute div with bg-black/55 over the image
// Ensures white hero text remains legible at all viewport sizes
Homepage — Who We Serve section

Each audience card gets a subtle background image with a gradient overlay:

tsx
// Professionals card
<Image
  src="/images/audience-professionals.webp"
  alt="Professional reviewing personal financial documents"
  fill
  className="object-cover object-top opacity-20"
  sizes="(max-width: 768px) 100vw, 33vw"
/>
// Note: opacity-20 — image is a subtle texture behind the text content
// Cards remain primarily text-driven — image adds warmth not dominance

Same pattern for audience-entrepreneurs.webp and audience-investors.webp.

Health Checks page hero
tsx
<Image
  src="/images/hero-health-checks.webp"
  alt="Professional completing a structured business assessment"
  width={2400}
  height={320}
  className="w-full object-cover object-center"
  style={{ maxHeight: '320px' }}  // desktop
  // Mobile: maxHeight: '200px'
  priority
/>
// No dark overlay on health checks hero — keep it light and clean
// Subtle bottom gradient: linear-gradient(to bottom, transparent 60%, white 100%)
Health Check cards
tsx
// Business Health Check card — image as card header (not full card)
<div className="relative h-48 w-full overflow-hidden rounded-t-lg">
  <Image
    src="/images/check-business.webp"
    alt="Business executive reviewing financial health data"
    fill
    className="object-cover object-center"
    sizes="(max-width: 768px) 100vw, 50vw"
  />
  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
</div>

Same pattern for Professional check using check-professional.webp.

Services pages — hero pattern (all 5 service pages)
tsx
// Shared hero pattern across all service category pages
// File varies per page — see image array above
<section className="relative h-[400px] md:h-[480px] overflow-hidden">
  <Image
    src={`/images/${heroImage}`}  // passed as prop to ServiceCategoryLayout
    alt={heroAlt}
    fill
    priority
    className="object-cover object-center"
    sizes="100vw"
  />
  <div className="absolute inset-0 bg-black/60" />
  {/* Content sits on top of overlay */}
  <div className="relative z-10 ...">
    {/* Category number, H1, tagline, CTA */}
  </div>
</section>
About page
tsx
// Hero
<Image
  src="/images/hero-about.webp"
  alt="Deni Sawa Partners advisory team in a professional setting"
  fill priority
  className="object-cover object-center"
/>
<div className="absolute inset-0 bg-black/50" />

// Philosophy section — split layout: text left, image right
<Image
  src="/images/about-philosophy.webp"
  alt="Nairobi city view representing vision and purpose"
  width={600}
  height={500}
  className="object-cover rounded-lg w-full h-full"
/>
Blog — default cover fallback
tsx
// In blog post card component
const coverImage = post.cover_image_url ?? '/images/blog-default-cover.webp'

<Image
  src={coverImage}
  alt={post.title}
  fill
  className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
Contact page
tsx
// Split layout: form left (60%), image right (40%)
// On mobile: image hidden, form full width
<div className="hidden md:block relative rounded-2xl overflow-hidden">
  <Image
    src="/images/hero-contact.webp"
    alt="Two professionals in a focused advisory conversation"
    fill
    className="object-cover object-center"
  />
  <div className="absolute inset-0 bg-black/30" />
  {/* Optional: floating quote card over image */}
  <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur rounded-xl p-6">
    <p className="text-sm font-medium text-gray-800 italic">
      "One conversation can change the direction of your business."
    </p>
    <span className="text-xs text-orange-600 font-semibold mt-2 block">
      — Deni Sawa Partners
    </span>
  </div>
</div>
OG Image — opengraph-image.tsx
tsx
// Update the opengraph-image.tsx to use the downloaded background
// Use Next.js ImageResponse with the og-background.webp as base
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1A1A1A',
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative'
        }}
      >
        {/* Background image — loaded as array buffer */}
        {/* Orange left accent bar */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '8px', background: '#E8510A' }} />
        {/* Logo + text content */}
        <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: '#E8510A', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            DENI SAWA PARTNERS
          </p>
          <h1 style={{ color: '#FFFFFF', fontSize: '52px', fontWeight: 700, lineHeight: 1.1, marginBottom: '24px' }}>
            From Special Situations{'\n'}to Best-in-Class
          </h1>
          <p style={{ color: '#A0A0A0', fontSize: '22px' }}>
            Senior-level advisory · Nairobi, Kenya
          </p>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
IMAGE OVERLAY SYSTEM

Define a consistent overlay system used across all hero images. Add this to your Tailwind config or globals.css:

css
/* globals.css */

/* Hero overlays — applied as absolute divs over images */
.overlay-dark    { background: rgba(0, 0, 0, 0.55); }  /* Hero images with white text */
.overlay-medium  { background: rgba(0, 0, 0, 0.40); }  /* Contact, about */
.overlay-light   { background: rgba(0, 0, 0, 0.20); }  /* Card background textures */
.overlay-orange  { background: linear-gradient(135deg, rgba(232,81,10,0.85) 0%, rgba(26,26,26,0.90) 100%); }
/* Use overlay-orange on service category heroes for brand impact */

/* Image hover zoom — applied to card image wrappers */
.img-zoom img {
  transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
}
.img-zoom:hover img {
  transform: scale(1.04);
}

Apply overlay-orange specifically to:

/services/professionals hero
/services/entrepreneurs hero

Apply overlay-dark to:

Homepage hero
/services/investors hero
/about hero
/services hub hero

Apply overlay-medium to:

Contact page image
Method page hero
PREMIUM PHOTOGRAPHY RULES — ENFORCE IN EVERY IMAGE

Apply these rules to every <Image> component added in this prompt:

Never:

Use layout="fill" (deprecated) — use fill prop only
Use <img> tags — Next.js <Image> only
Render images above 3840px width
Load hero images without priority prop
Add images without meaningful alt text describing the actual content

Always:

Set sizes prop correctly based on where the image renders
Use quality={85} for card images, quality={90} for hero images
Wrap card images in a container with overflow-hidden and fixed height
Add .webp extension explicitly in src
Use object-fit: cover with object-position: center unless a specific crop is needed
Add loading="lazy" on all images below the fold (Next.js does this automatically when priority is not set — just confirm priority is only on above-fold images)
PACKAGE.JSON SCRIPT

Add to package.json:

json
"scripts": {
  "download-images": "node scripts/download-images.mjs"
}

Run order:

bash
npm install sharp
npm run download-images
# Verify all files exist in /public/images/
ls public/images/*.webp
# Then run the dev server to verify rendering
npm run dev
OUTPUT ORDER
Install sharp: confirm it is in package.json devDependencies
Write /scripts/download-images.mjs with the full image array
Run the download script and confirm all .webp files are written to /public/images/
Update homepage: hero, who-we-serve cards, health checks section
Update /health-checks page: hero image + both check cards
Update /services hub page hero
Update /services/professionals hero
Update /services/entrepreneurs hero
Update /services/investors hero
Update /services/learning hero
Update /about page: hero + philosophy section
Update /contact page: split layout with image
Update blog post card component: default cover fallback
Update opengraph-image.tsx
Add overlay CSS utilities to globals.css
Verify all images render correctly on mobile and desktop

Show each changed file. Do not rebuild any page — surgical image implementation only.
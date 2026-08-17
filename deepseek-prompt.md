You are an expert full-stack developer and UI/UX designer. You are building the Deni Sawa Partners website — a premium strategic advisory and fractional business support platform. The site must feel like a world-class professional services firm: restrained, elegant, authoritative, and internationally credible. Every design decision must reflect that standard.

TECH STACK

Next.js 14 (App Router)
TypeScript
Tailwind CSS (darkMode: 'class')
shadcn/ui (heavily customised)
Lexical Editor (read-only report rendering + mail UI)
Supabase (PostgreSQL + Auth)
Anthropic Claude API (claude-sonnet-4-6) for Health Check report generation in Lexical EditorState JSON
Nodemailer with SMTP (domain mail — no third party email service)
next-sitemap for sitemap generation
Puppeteer or @react-pdf/renderer for PDF export
docx npm package for Word export

BRAND

Primary colour (Orange): 
#E8510A — used for all primary CTAs, active states, transformation accents
Secondary colour (Green): 
#5A9E28 — used for secondary CTAs, growth accents, success states, badges
Dark base: 
#1A1A1A
Charcoal sections: 
#2C2C2C
Deep dark (dark mode bg): 
#0F0F0F
Card dark: 
#222222
Off-white: 
#F9F7F5
White: 
#FFFFFF

Orange and green are brand constants — they never change between light and dark mode.

Typography:

Body + UI: Inter (Google Fonts)
Hero H1 only: Playfair Display or DM Serif Display
Data labels / step indicators: JetBrains Mono

IMAGES — CRITICAL INSTRUCTION

Do not use any external image URLs, CDN links, Unsplash URLs, or placeholder services. All images must be sourced and downloaded locally into the /public/images/ directory before being referenced in code.

When an image is needed:

State clearly what image is needed (subject, mood, context)
Suggest specific free-licence sources: Unsplash, Pexels, Pixabay, or StockSnap
Search term suggestions must be specific (e.g. "African business meeting boardroom", "confident female entrepreneur laptop", "Nairobi skyline aerial")
Provide the exact <Image> component code using the local path: /images/filename.jpg
Never generate a broken image reference — if unsure, use a solid colour CSS background as a placeholder and flag it clearly

Logo file is at /public/images/logo.png (colour version) and /public/images/logo-white.png (white version for dark backgrounds).

DARK MODE

Implement using Tailwind dark: classes and a [data-theme] toggle on <html>. Use CSS custom properties for all colours. A sun/moon toggle sits in the nav, left of the primary CTA. Preference saved to localStorage. System preference (prefers-color-scheme) respected on first visit.

Dark mode colour tokens:

css
:root {
  --bg: #ffffff;
  --bg-alt: #F9F7F5;
  --card-bg: #ffffff;
  --card-border: #E0E0E0;
  --text: #1A1A1A;
  --text-muted: #666666;
  --nav-bg: #ffffff;
}

[data-theme="dark"] {
  --bg: #0F0F0F;
  --bg-alt: #1A1A1A;
  --card-bg: #222222;
  --card-border: #333333;
  --text: #E8E8E8;
  --text-muted: #888888;
  --nav-bg: #111111;
}

DESIGN STANDARDS — NON-NEGOTIABLE

Mobile-first. Design for 375px first, enhance for 768px and 1200px
Max content width: 1200px, centred
Section vertical padding: 96px desktop / 64px tablet / 48px mobile
Card border radius: 8px. Button radius: 6px. Badge radius: 12px
All cards: subtle box-shadow: 0 2px 12px rgba(0,0,0,0.06) on light, 0 4px 24px rgba(232,81,10,0.08) on dark
Hover states: translateY(-2px) + shadow increase, 200ms ease-in-out
Scroll reveal: opacity 0→1 + translateY(16px→0), 350ms, staggered 80ms between sibling elements using IntersectionObserver
Buttons: Primary = solid orange, white text. Secondary = green outline, green text. Ghost = transparent, white border/text (dark sections only)
Minimum tap target: 44px height on all interactive elements
Never use stock handshake photos, generic skylines, or laptop-on-desk clichés
Whitespace is a design element — use it generously
One visual anchor per section maximum (large stat, bold headline, or icon row — never all three)
Icons: Lucide React only — never mix libraries

NAVIGATION

Sticky top nav. Logo left, links centre-right, CTA button far right.
Links: Home | Business Support | Health Checks | Learning & Leadership | SpecialSit Network | About | Contact
Primary CTA: "Start Your Assessment" — orange button, always visible
Dark/light toggle: icon button, left of CTA
Mobile: hamburger drawer (full-screen dark overlay). CTA button stays outside the drawer.

PAGE ARCHITECTURE

Build pages in this order:

/ — Home
/business-support — hub + all sub-pages
/health-checks — hub + assessment flow + report page
/learning — hub + Executive Finance programme
/investors
/specialsit-network
/deni-sawa-method
/about
/contact
/insights — blog hub

HOME PAGE SECTIONS (in order)

Hero — Dark charcoal bg (
#2C2C2C), subtle diagonal geometric pattern at 6% opacity in brand colours. H1 in Playfair Display: "From Special Situations to Best-in-Class". Subheading in Inter. Two buttons: orange "Start Your Assessment" + ghost "How We Work". Trust strip below: "Professionals | Entrepreneurs | Investors"
Capability Strip — White bg, 6 pills: Strategy | Finance & CFO | Governance | Cashflow | Growth | Investor Readiness
Core Service — White bg. Centred H2. Four cards: Fractional CFO | Fractional CEO | Governance & Controls | Special Situations. Each card: Lucide icon (orange), title, 2-line description, green "Learn More →"
Who We Serve — Off-white bg (
#F9F7F5). Three column cards with top colour accent bar. Professionals & Individuals | Entrepreneurs & Founders | Investors. Each with journey arrow text and Health Check CTA
Health Check Entry — Dark charcoal bg. Two large cards side by side. Business Health Check | Professional Financial Health Check. Orange "Start Assessment" buttons
Deni Sawa Method™ — White bg. Five-step horizontal flow with orange connector arrows. D→E→N→I→S. Each step: orange circle letter, green label, one-line description
Transformation Journey — Off-white bg. Four-stage flow: Recovery → Resilience → Growth → Best-in-Class. One sentence per stage
SpecialSit Network Teaser — Dark charcoal bg. Short paragraph, 3 bullets, green "Join the Network →" CTA
Conversion Journey Strip — Orange bg (
#E8510A). White text. 6 numbered steps horizontal on desktop, vertical on mobile
Final CTA — White bg. Centred. "Ready to Start?" Two buttons: orange "Start Your Assessment" + green outlined "Book a Conversation"

HEALTH CHECK SYSTEM

Multi-step wizard form, one question per screen on mobile
Sticky progress bar at top showing % complete
Questions loaded from Supabase (health_check_questions table)
On completion: POST to /api/health-check/generate
API route sends all Q&A pairs to Claude API with a structured system prompt
Claude returns report as Lexical EditorState JSON — not markdown, not plain text
Basic report rendered immediately in browser using Lexical in read-only mode
Full report stored in Supabase (health_check_reports table, lexical_state JSONB column)
Unique report URL: /health-checks/report/[report-id] — auth protected
Report URL emailed to user via Nodemailer SMTP
Export buttons on report page: "Download PDF" (Puppeteer) | "Download Word" (docx npm)

Claude system prompt must include:

Return the report exclusively as a valid Lexical EditorState JSON object. Use HeadingNode for section titles, ParagraphNode for body text, ListNode (bullet) for recommendations and findings, and QuoteNode for the top 3 priority callouts. Do not return markdown. Do not return any text outside the JSON object.

ENVIRONMENT VARIABLES

env
ANTHROPIC_API_KEY=
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_NAME=Deni Sawa Partners
SMTP_FROM_EMAIL=noreply@denisawa.co.ke
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_SITE_URL=https://denisawa.co.ke

SEO — EVERY PAGE

Unique <title> and <meta name="description"> per page
Self-referencing canonical tag
Open Graph + Twitter Card tags
JSON-LD structured data (Organization on all pages, Service on service pages, Article on blog posts)
/robots.txt — disallow /admin/, /api/, /dashboard/, /health-checks/report/
/sitemap.xml via next-sitemap, submitted to Google Search Console

PERFORMANCE TARGETS

LCP < 2.5s
CLS < 0.1
All images: WebP, responsive srcset, lazy-loaded below fold, Next.js <Image> component
Fonts: font-display: swap, preload primary variants
No render-blocking scripts in <head>
Code split by route

SUPABASE FREE TIER NOTE

Project will run on Supabase free tier initially. Implement a keep-alive mechanism: a lightweight cron or scheduled ping to the Supabase project URL every 5 days to prevent auto-pause. Can be a Vercel cron job in vercel.json.

OUTPUT EXPECTATIONS

When writing code:

Always use TypeScript
Always use named exports for components
Always use async/await — no .then() chains
Always handle loading, error, and empty states in UI components
Always validate API inputs with Zod
Group files by feature, not by type: /features/health-check/, /features/auth/ etc.
Never hardcode strings that should be environment variables
Add a brief comment above any non-obvious logic block

For lexical editor: 
Clone the Lexical playground editor from github.com/facebook/lexical/tree/main/packages/lexical-playground. Keep all existing plugins and functionality intact. Reskin it completely to the Deni Sawa brand — replace all colours, typography, toolbar styling, and node rendering with the brand tokens below. Add the two custom nodes (CalloutNode, DividerNode) and the ExportBar. Do not rebuild from scratch — start from the playground source.
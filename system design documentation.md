**DENI SAWA PARTNERS**

_Special Situations → Best-in-Class Transformation_

**WEBSITE BUILD SPECIFICATION**

Comprehensive Design, Development, SEO & Technical Prompt

Version 1.0 | Phase 1: Website (LMS excluded)

denisawa.co.ke

# 1\. Document Purpose & Scope

This document is the master specification for the Deni Sawa Partners website. It is intended for the development team, UI/UX designer, and technical SEO specialist. It covers every aspect of the site build including visual design, page architecture, component detail, copywriting direction, conversion flow, SEO, technical configuration, and deployment.

Phase 1 scope: Main website only. The Learning Management System (LMS) is excluded and will be addressed in a separate Phase 2 specification.

# 2\. Brand Identity & Visual Language

## 2.1 Brand Positioning

Deni Sawa Partners is a premium strategic advisory and fractional business support platform. The brand must communicate authority, clarity, international credibility, and practical expertise - not generic consulting aesthetics.

The visual language should feel like a leading professional services firm: restrained, confident, clean, and modern. Avoid cluttered layouts, stock photo overuse, or generic SaaS design patterns.

## 2.2 Colour Palette

**Primary Brand Colour (Orange):** #E8510A - Action, energy, urgency, transformation

**Secondary Brand Colour (Green):** #5A9E28 - Growth, resilience, sustainability, trust

**Dark Base:** #1A1A1A - Body text, headings on light backgrounds

**White:** #FFFFFF - Primary background for content sections

**Off-White / Warm Light:** #F9F7F5 - Section alternation, subtle warmth

**Light Neutral:** #F0F0F0 - Dividers, card backgrounds

**Deep Charcoal:** #2C2C2C - Dark section backgrounds, footer

_💡 Orange is always the primary CTA colour. Green is used for secondary CTAs, success states, badges, and ecosystem highlights. Never swap these roles._

## 2.3 Typography

**Primary Typeface:** Inter (Google Fonts) - Clean, modern, international. Use across all body and UI text.

**Display / Hero Headings:** Playfair Display or DM Serif Display - For premium editorial impact on H1 and large hero text only.

**Monospace / Accent:** JetBrains Mono - For data labels, step indicators, code-style accents only.

**H1 (Hero):** 52-64px / Bold / Tight line height 1.1

**H2 (Section Heading):** 36-42px / SemiBold / Line height 1.2

**H3 (Sub-section):** 24-28px / SemiBold / Line height 1.3

**Body Large:** 18px / Regular / Line height 1.7

**Body:** 16px / Regular / Line height 1.7

**Caption / Labels:** 13-14px / Medium / Uppercase tracking for labels

_💡 Mobile type sizes should scale down by ~15%. Never go below 15px for body text on mobile._

## 2.4 Spacing & Layout Grid

**Grid:** 12-column responsive grid, max content width 1200px

**Section vertical padding:** 96px desktop / 64px tablet / 48px mobile

**Component gap:** 24px base unit

**Card padding:** 32px desktop / 24px mobile

**Border radius:** 8px cards / 4px buttons / 12px badges/pills

## 2.5 UI Components Style

**Primary Button:** Solid orange #E8510A, white text, 8px radius, 16px/32px padding, hover darken 10%

**Secondary Button:** Outlined green border #5A9E28, green text, same sizing, hover fill green

**Ghost Button:** Transparent, white border/text for use on dark sections

**Cards:** White background, 1px #E0E0E0 border, 8px radius, subtle shadow on hover

**Dark Cards:** #2C2C2C background with orange or green accent top border

**Badges/Pills:** Rounded, orange or green background, white text, 12px radius, uppercase small text

**Input fields:** White bg, 1px #CCCCCC border, 4px radius, orange focus ring

**Dividers:** 1px solid #E8E8E8 or full-width orange/green accent bar at section level

**2.6 Dark Mode Theme**

The site must support a light/dark mode toggle. Dark mode is not an inversion of light mode - it has its own intentional colour mapping that preserves brand authority.

**Toggle Behaviour**

- A sun/moon icon toggle sits in the top navigation bar, to the left of the primary CTA button
- User preference is saved to localStorage and respected on return visits
- System preference (prefers-color-scheme) is honoured on first visit before the user makes a manual choice

**Dark Mode Colour Mapping**

| **Token**              | **Light Mode** | **Dark Mode**       |
| ---------------------- | -------------- | ------------------- |
| Page background        | #FFFFFF        | #0F0F0F             |
| Section alt background | #F9F7F5        | #1A1A1A             |
| Card background        | #FFFFFF        | #222222             |
| Card border            | #E0E0E0        | #333333             |
| Body text              | #1A1A1A        | #E8E8E8             |
| Muted / caption text   | #666666        | #888888             |
| Primary Orange         | #E8510A        | #E8510A (unchanged) |
| Primary Green          | #5A9E28        | #5A9E28 (unchanged) |
| Nav background         | #FFFFFF        | #111111             |
| Footer background      | #2C2C2C        | #0A0A0A             |

**Rules**

- Orange and green never change between modes - they are brand constants
- Dark sections that exist in light mode (charcoal #2C2C2C) become deeper (#0F0F0F) in dark mode
- The orange CTA button remains identical in both modes
- All contrast ratios must still meet WCAG 2.1 AA in dark mode - test independently
- Shadows in dark mode switch from dark shadows to subtle glow: box-shadow: 0 4px 24px rgba(232, 81, 10, 0.08) for orange-accented cards

**Implementation**

- Use CSS custom properties (--color-bg, --color-text, etc.) on :root with a \[data-theme="dark"\] override - never hardcode hex values in component CSS
- Tailwind: enable darkMode: 'class' in tailwind.config.js and toggle the dark class on &lt;html&gt;
- Transitions: transition: background-color 200ms ease, color 200ms ease on body for a smooth switch - do not animate every element individually

# 3\. Site Architecture & Navigation

## 3.1 Main Navigation

The navigation must be clean, premium, and minimal. Avoid overwhelming dropdown mega-menus. Use a single sticky top navigation bar with a restrained dropdown on desktop and a full-screen slide-in drawer on mobile.

Navigation items (left-aligned logo, right-aligned menu):

- Home
- Business Support (dropdown)
- Health Checks
- Learning & Leadership
- SpecialSit Network
- About (dropdown)
- Contact

**Primary CTA (always visible):** "Start Your Assessment" - orange button, top right of nav, persists on scroll

**Secondary:** "Investor & Partner Enquiries" - text link below hero or in About dropdown

_💡 The CTA button must remain visible on mobile. Collapse other links into the hamburger but keep the CTA button outside the drawer for mobile conversion._

## 3.2 Full Sitemap

- / - Home
- /business-support - Business Support (hub)
- /business-support/fractional-cfo
- /business-support/fractional-ceo
- /business-support/governance-controls
- /business-support/growth-support
- /business-support/special-situations
- /business-health-checks - Health Checks (hub)
- /business-health-checks/business-health-check
- /business-health-checks/professional-financial-health-check
- /learning - Learning & Leadership (hub)
- /learning/executive-finance
- /learning/business-recovery
- /learning/governance
- /learning/financial-resilience
- /investors - Investors
- /investors/investor-readiness
- /investors/portfolio-oversight
- /investors/governance
- /investors/investor-representation
- /about/specialsit-network - SpecialSit Network
- /deni-sawa-method - The Method
- /insights - Insights / Blog
- /about - About (hub)
- /about/leadership
- /about/philosophy
- /about/experience
- /contact

# 4\. Page-by-Page Specification

## 4.1 Home Page ( / )

### Hero Section

Full-width section. Dark charcoal (#2C2C2C) or deep navy background with a subtle geometric or abstract diagonal pattern in brand colours at very low opacity (5-10%). No stock photography in the hero.

**H1:** From Special Situations to Best-in-Class

**Subheading:** AI-enabled advisory and fractional business support helping organisations recover, stabilise, grow and perform at their best.

**Primary CTA:** "Start Your Assessment" - orange button

**Secondary CTA:** "How We Work" - ghost button linking to the Method

**Trust strip below CTA:** Small logos or text: "Serving Professionals | Entrepreneurs | Investors" with dividers

_💡 Avoid hero images of handshakes, skylines, or generic team photos. The hero must command authority through typography and layout alone._

### Capability Strip

A narrow strip beneath the hero, white or off-white background. Six capability pills or icon+label tiles displayed horizontally:

- Strategy
- Finance & CFO
- Governance
- Cashflow
- Growth
- Investor Readiness

### Core Service Section

White background. Centre-aligned heading: "Fractional / Part-Time Business Support". Subheading: "Senior-level expertise. Part-time commitment. Full-time impact."

Four-column card layout (2 col on tablet, 1 col on mobile):

- Fractional CFO / Financial Leadership
- Fractional CEO / Strategic Advisory
- Governance & Business Controls
- Special Situations Support

Each card: icon, short title, 2-line description, "Learn More" arrow link in green.

### Three Audience Pathways

Off-white (#F9F7F5) section. Heading: "Who We Serve". Three column cards with a top colour accent bar (orange for active card, green for others):

- Professionals & Individuals - Financial Health → Resilience → Leadership
- Entrepreneurs & Founders - Stability → Structure → Growth → BIC
- Investors - Visibility → Governance → Accountability → Portfolio Performance

Each card has a short paragraph, an entry point link, and a "Take the Health Check" CTA.

### Health Check Entry

Dark section (#2C2C2C background). Heading: "Where Are You Right Now?" Two cards side by side:

- Business Health Check - AI-powered assessment of financial health, operations, governance, cashflow and growth readiness.
- Professional Financial Health Check - AI-powered assessment of personal finances, debt, cashflow, savings and future security.

Each card: short description, orange "Start Assessment" button.

### Deni Sawa Method™ Strip

White background. Heading: "The Deni Sawa Method™". Five-step horizontal flow with connector arrows:

- D - Diagnose: Understand the real situation
- E - Evaluate: Determine priorities, risks and opportunities
- N - Negotiate: Create workable solutions
- I - Implement: Put the recovery or growth plan into action
- S - Sustain: Build systems that prevent regression

Each step: letter in orange circle, label in bold, one-line description. Link: "Explore the Method →"

### Transformation Journey

Light green tinted section or white with green accents. Four-stage arrow flow:

Recovery → Resilience → Growth → Best-in-Class

Below each stage: 1-2 lines explaining what it means. Tone: confident, human, not corporate jargon.

### SpecialSit Network Teaser

Dark charcoal section. Heading: "The SpecialSit Network (SS-N)". Short paragraph: the community and relationship layer of the ecosystem. 3 benefit bullets. CTA: "Join the Network →"

### Conversion Journey Strip

Orange background strip. Numbered 6-step horizontal journey (numbered pills):

- 1\. Identify - What is your situation?
- 2\. Assess - Take the relevant Health Check
- 3\. Understand - Receive your Health Report
- 4\. Choose - Self-Learning | Mentorship | Fractional Support | Advisory
- 5\. Implement - LMS + Tools + Advisory + Accountability
- 6\. Transform - Recovery → Resilience → Growth → Best-in-Class

### Final CTA Section

White section. Centred heading: "Ready to Start?" Subtext: "Take the first step. No obligation. Confidential." Two buttons: orange "Start Your Assessment" + green outlined "Book a Conversation".

## 4.2 Business Support Page

This is the flagship commercial page. It must be the most detailed and convincing page on the site. Layout: page hero at top, tabbed or anchored navigation to each service area below.

Service areas to build out fully:

**Fractional CFO / Financial Leadership:** Financial visibility, cashflow management, management reporting, financial controls, budgeting, working capital, financial decision support

**Fractional CEO / Strategic Leadership:** Strategic planning, business performance, growth execution, management accountability, business restructuring, founder transition

**Governance & Business Controls:** Governance structures, policies, accountability systems, KPI frameworks, management dashboards, risk controls

**Growth & Business Development:** Growth strategy, revenue optimisation, business model review, strategic partnerships, investor readiness

**Special Situations Support:** Financial distress, debt pressure, cashflow crisis, underperformance, founder dependency, restructuring, recovery

Each service area: bold heading, short positioning paragraph, 6-8 bullet capabilities, a "Discuss This" CTA.

_💡 Include a sticky in-page anchor navigation bar on desktop so users can jump between service areas without scrolling back to the top._

## 4.3 Health Checks Page

The Health Check pages are the primary digital lead-generation mechanism. They must feel premium, trustworthy, and very easy to begin.

Hub page layout:

- Hero: "Understand Your Situation. Get Clarity. Take Action."
- Two large entry point cards: Business Health Check | Professional Financial Health Check
- How it works: 3-step explainer (Answer questions → AI generates your report → Receive recommendations)
- What you will get: Basic report (free) vs Full report (paid/registered). Clear comparison.
- Privacy assurance message

**Business Health Check:** AI-powered assessment across: Financial Health, Operations, Governance, Cashflow, Growth/Investment Readiness. Questions stored in database. Claude AI generates the report. Outputs: Basic Report (summary) and Full Report (detailed prioritisation and recommendations).

**Professional Financial Health Check:** AI-powered assessment across: Personal finances, Debt, Cashflow, Savings, Resilience, Future financial security.

_💡 Database stores question sets and AI prompts per check type. Responses are stored. Claude AI generates both basic and full reports. Build the question flow as a multi-step form with a progress bar, not a single long scrollable form._

## 4.4 Learning & Leadership Page

Position as leadership capability development - not generic training or an online course marketplace.

Flagship programme: Executive Finance for Non-Finance Leaders

- No accounting background required
- Understand financial statements and business numbers
- Make better decisions around profitability, cashflow and working capital
- Strengthen governance, reporting and financial controls
- Connect finance to business performance and leadership decisions

Additional learning pathways to feature:

- Business Recovery
- Governance
- Financial Resilience
- Learning Centre / LMS (Phase 2 - reference only on this page with "Coming Soon" state)

_💡 The LMS is Phase 2 and should not be fully built yet. Include a teaser section on this page with a waitlist capture form._

## 4.5 Investors Page

A dedicated investor pathway for Angel Investors, VCs, institutional investors, family offices and strategic investors.

Sections:

- Investor Readiness - Preparing founders and businesses for investment
- Post-Investment Oversight - Independent monitoring after investment
- Governance Monitoring - Ensuring governance standards are maintained
- Portfolio Performance - Performance tracking and reporting
- Founder Accountability - Holding founders accountable to commitments
- Risk Tracking - Identifying and escalating material risks
- Investment Reporting - Clear, structured reporting for investors
- Independent / Outsourced Investor Representation

CTA: "Investor & Partner Enquiry →" - separate form with specific investor fields.

## 4.6 SpecialSit Network Page

Position the network as the relationship and community layer of the ecosystem - not another consulting service.

- Membership
- Peer Forums
- Mentorship
- Investor Connections
- Strategic Partnerships
- Learning
- Accountability

CTA: Application or expression of interest form. Premium feel. Not a free community - express exclusivity and purpose.

## 4.7 Deni Sawa Method™ Page

Dedicated standalone page explaining the methodology in depth. The ™ must always appear with the name. Five steps, each with a full section:

- D - Diagnose: Understand the real situation
- E - Evaluate: Determine priorities, risks and opportunities
- N - Negotiate: Create workable solutions
- I - Implement: Put the recovery or growth plan into action
- S - Sustain: Build systems that prevent regression and support long-term performance

Each step: large letter in orange, step name in green, 2-3 sentences of description, example outcomes.

# 5\. Design Elegance & Visual Refinement

## 5.1 Principles

- Whitespace is not empty space - it communicates premium quality. Use generous padding throughout.
- Every section must have one clear visual anchor: a large number, a bold typographic headline, or a restrained icon row. Never more than one.
- Limit colour usage per section. Each section should be dominated by one colour with accents only.
- Micro-interactions on hover for all cards and buttons: subtle shadow increase, slight scale up (1.02), smooth transition (200ms ease).
- Scroll animations: fade-in-up on section entry (IntersectionObserver, no GSAP dependency for performance). Keep animations fast (300-400ms) and professional - not playful.
- Icons: use a single consistent icon library across the entire site. Recommended: Phosphor Icons or Lucide. Never mix libraries.
- Photography: only use if it is real, high-quality, and relevant to the African/international business context. Default to illustration-free, typography-led design where photography is not available.

## 5.2 Section Alternation Pattern

To create visual rhythm without being repetitive, alternate section backgrounds in this pattern:

- White (#FFFFFF)
- Off-White (#F9F7F5)
- Dark Charcoal (#2C2C2C) - for high-emphasis/CTA sections
- Orange (#E8510A) - for conversion/journey strips only, used sparingly

Never stack two dark sections back to back. Never stack two orange sections.

## 5.3 Motion & Interaction Standards

**Page transitions:** Simple fade (150ms) - no slide or complex transitions

**Card hover:** box-shadow increase + translateY(-2px), 200ms ease-in-out

**Button hover:** Background darken 10%, no scale transform on buttons

**Scroll reveal:** opacity 0→1 + translateY(16px→0), 350ms, staggered 80ms between items

**Mobile tap:** Active state with orange tint. No delay.

# 6\. Mobile-First Requirements

The primary design canvas is mobile (375px). Desktop is the enhanced experience, not the baseline.

**Breakpoints:** Mobile: 375px / Tablet: 768px / Desktop: 1200px / Wide: 1440px

**Navigation:** Hamburger icon with full-screen dark overlay drawer. CTA button remains visible outside the drawer.

**Cards:** Stack vertically on mobile. No horizontal scroll unless explicitly designed as a carousel.

**Typography scaling:** H1 max 36px on mobile. Body 15-16px minimum.

**Tap targets:** Minimum 44px height for all interactive elements per WCAG 2.1 AA

**Images:** WebP format. Responsive srcset. Lazy-loaded below the fold.

**Forms:** Single-column on mobile. Large input fields. No side-by-side fields below 480px.

**Health Check forms:** One question per screen on mobile (wizard/step flow) with a sticky progress bar and "Next" button.

# 7\. SEO Strategy & Technical Configuration

## 7.1 On-Page SEO: Meta Tags by Page

**Home - Title:** Deni Sawa Partners | Fractional CFO & Business Advisory | Special Situations

**Home - Description:** AI-enabled fractional business support helping organisations move from Special Situations to Best-in-Class performance. Take your Business Health Check today.

**Home - Keywords (supplementary):** fractional CFO Africa, business advisory Kenya, special situations advisory, business turnaround, fractional CEO

**Business Support - Title:** Fractional CFO & CEO Business Support | Deni Sawa Partners

**Business Support - Description:** Senior-level fractional CFO, CEO, governance and growth support. Part-time commitment, full-time impact. Serving businesses in crisis and growth.

**Health Checks - Title:** Business & Financial Health Check | AI-Powered Assessment | Deni Sawa

**Health Checks - Description:** Take our free AI-powered Business or Professional Financial Health Check and receive a diagnostic report with prioritised recommendations.

**SpecialSit Network - Title:** SpecialSit Network (SS-N) | Business Peer Network | Deni Sawa Partners

**SpecialSit Network - Description:** Join the SpecialSit Network - a curated peer community for founders, professionals and investors navigating complex business situations.

**Investors - Title:** Investor Readiness & Portfolio Oversight | Deni Sawa Partners

**Investors - Description:** Independent investor support: readiness assessment, governance monitoring, portfolio performance tracking, and founder accountability.

**Method - Title:** The Deni Sawa Method™ | Diagnose. Evaluate. Negotiate. Implement. Sustain.

**Method - Description:** Our five-step transformation methodology guiding organisations from diagnosis to sustained Best-in-Class performance.

**About - Title:** About Deni Sawa Partners | Strategic Advisory & Fractional Support

**About - Description:** Learn about Deni Sawa Partners - our leadership, philosophy, and commitment to helping organisations transform from Special Situations to Best-in-Class.

## 7.2 Open Graph & Social Meta Tags

All pages must include the following meta tags in &lt;head&gt;:

&lt;meta property="og:title" content="\[Page Title\]" /&gt;

&lt;meta property="og:description" content="\[Page Description\]" /&gt;

&lt;meta property="og:image" content="<https://deni-sawa.vercel.app/og-image.png>" /&gt;

&lt;meta property="og:url" content="<https://deni-sawa.vercel.app/\[page-path\>]" /&gt;

&lt;meta property="og:type" content="website" /&gt;

&lt;meta property="og:site_name" content="Deni Sawa Partners" /&gt;

&lt;meta name="twitter:card" content="summary_large_image" /&gt;

&lt;meta name="twitter:title" content="\[Page Title\]" /&gt;

&lt;meta name="twitter:description" content="\[Page Description\]" /&gt;

&lt;meta name="twitter:image" content="<https://deni-sawa.vercel.app/og-image.png>" /&gt;

_💡 OG image dimensions: 1200×630px. Create a branded image with the Deni Sawa logo, the tagline, and the orange/green colour palette._

## 7.3 Canonical Tags

Every page must have a self-referencing canonical tag:

&lt;link rel="canonical" href="<https://deni-sawa.vercel.app/\[page-path\>]" /&gt;

If content is served from multiple URLs (e.g., www and non-www), ensure 301 redirects to the canonical version. Use non-www as the canonical base or configure based on DNS setup.

## 7.4 Structured Data (Schema.org)

Implement JSON-LD schema on relevant pages:

**All pages:** Organization schema with name, url, logo, contactPoint, sameAs (LinkedIn, social)

**Home:** WebSite schema with SearchAction if site search is implemented

**Business Support sub-pages:** Service schema with serviceType, provider, areaServed, description

**Health Checks:** SoftwareApplication or Service schema

**About/Leadership:** Person schema for named leaders

**Insights/Blog posts:** Article schema with author, datePublished, dateModified, image

Example Organization schema:

{"@context":"<https://schema.org","@type":"Organization","name":"Deni> Sawa Partners","url":"<https://deni-sawa.vercel.app","logo":"https://deni-sawa.vercel.app/logo.png","contactPoint":{"@type":"ContactPoint","contactType":"customer> service","email":"<info@denisawa.co.ke>"}}

## 7.5 robots.txt

Create a robots.txt file at the domain root (/robots.txt) with the following content:

User-agent: \*

Allow: /

Disallow: /admin/

Disallow: /api/

Disallow: /dashboard/

Disallow: /health-check/results/

Disallow: /\_next/

Sitemap: <https://deni-sawa.vercel.app/sitemap.xml>

_💡 Adjust Disallow paths to match the actual framework routing structure (Next.js, etc.). The Health Check results pages should be disallowed to prevent indexing of private user report content._

## 7.6 XML Sitemap

Generate and submit an XML sitemap at /sitemap.xml. If using Next.js, use the next-sitemap package. The sitemap must include:

- All static pages with lastmod, changefreq, and priority
- Priority 1.0: Home
- Priority 0.9: Business Support, Health Checks
- Priority 0.8: All sub-service pages, Learning, Investors, SpecialSit Network
- Priority 0.7: About, Contact, Method, Insights hub
- Priority 0.6: Individual Insights/blog posts
- Exclude: /admin/, /api/, /dashboard/, /health-check/results/

Submit sitemap to Google Search Console and Bing Webmaster Tools immediately after launch.

## 7.7 Core Web Vitals & Performance

**LCP (Largest Contentful Paint):** Target < 2.5s. Preload hero font and hero background image.

**CLS (Cumulative Layout Shift):** Target < 0.1. Always specify width and height on images. Reserve space for web fonts.

**FID/INP (Interaction):** Target &lt; 200ms. Defer non-critical JS. No render-blocking scripts in <head&gt;.

**Images:** All images in WebP format. Use Next.js Image component or equivalent for automatic optimisation.

**Fonts:** Self-host or use font-display: swap. Preload primary font variants.

**JavaScript:** Code split by route. No unused libraries in production bundle.

**Caching:** Static assets: 1 year cache-control. HTML: short cache or no-cache.

## 7.8 URL Structure

All URLs must be:

- Lowercase with hyphens, never underscores
- Descriptive and keyword-rich
- Short - no more than 3-4 path segments
- No query parameters in public indexable URLs
- 301 redirects in place for any old URLs if migrating

# 8\. Technical Stack & Configuration

## 8.1 Recommended Stack

**Framework:** Next.js 14+ (App Router) - for SSR, SSG, ISR, and API routes

**Language:** TypeScript

**Styling:** Tailwind CSS with custom design tokens for brand colours, spacing, and typography

**UI Components:** shadcn/ui base with heavy customisation to match brand

**Database:** PostgreSQL via Supabase (for Health Check question storage, response storage, user data)

**AI Integration:** Anthropic Claude API (claude-sonnet-4-6) for Health Check report generation

**Authentication:** Supabase Auth or NextAuth.js for registered user accounts

**Forms:** React Hook Form + Zod for validation

**Email:** Resend or SendGrid for transactional email (assessment results, enquiries)

**Analytics:** Google Analytics 4 (GA4) + Google Tag Manager

**Hosting:** Vercel (current) - configure custom domain, environment variables, and preview deployments

**CMS (Insights):** Contentful or Sanity for blog/insights content management

## 8.2 Health Check Technical Architecture

The Health Check system is a core feature and must be built with care. Architecture:

- Questions stored in PostgreSQL table: check_type, question_id, question_text, question_category, input_type, options (JSON), order
- On submission: user responses stored in responses table with session ID, timestamp, check_type
- Server-side API route calls Claude API with: system prompt (specific to check type), all question/answer pairs, instruction to return structured JSON report
- Basic report: rendered immediately in browser from API response (summary + top 3 priorities)
- Full report: available after email registration or payment - stored in database, sent via email, accessible in user dashboard
- Progress is saved in localStorage so users can resume incomplete assessments

_💡 The AI prompt for each check type should be stored in the database as a configurable field so it can be updated without code deployment._

**Report Rendering & Delivery (Lexical Editor + Export)**

The AI-generated Health Check report must be rendered using the **Lexical editor** (already in use on the site) in read-only display mode. This gives the report rich text formatting - headings, bold priorities, bullet lists, callout blocks - rather than plain text output.

**How it works:**

- Claude API is prompted to return the report as **Lexical editor JSON state** (EditorState JSON), not plain text or markdown
- The system prompt instructs Claude to structure the response as valid Lexical JSON with appropriate node types: HeadingNode, ParagraphNode, ListNode, ListItemNode, and optionally QuoteNode for highlighted priorities
- The returned JSON is stored in the database against the assessment record
- On the report page, Lexical is initialised in read-only mode with the stored EditorState - the report renders exactly as Claude structured it

**Report Page:**

- Each completed Health Check gets a unique shareable URL: /business-health-checks/report/[report-id]
- The URL is emailed to the user on completion
- The page is auth-protected - only the user who completed the assessment (or an admin) can access it
- A "This report is private and unique to you" notice sits at the top

**Export Options (prominent buttons on the report page):**

- **Download PDF** - server-side: Lexical EditorState is serialised to HTML, then converted to PDF using puppeteer or @react-pdf/renderer. Branded with Deni Sawa Partners header, logo, date, and assessment type in the PDF header/footer
- **Download Word (.docx)** - Lexical EditorState nodes are mapped to docx npm library elements and rendered as a formatted Word document with brand fonts and colours

**Claude prompt instruction to add for Lexical output:**

"Return the report exclusively as a valid Lexical EditorState JSON object. Use HeadingNode for section titles, ParagraphNode for body text, ListNode (bullet) for recommendations and findings, and QuoteNode for the top 3 priority callouts. Do not return any text outside the JSON object."

**Storage:**

- report_id - UUID
- check_type - business | professional
- user_id - linked to auth
- lexical_state - JSONB column in Supabase (stores the full EditorState)
- created_at - timestamp
- report_url - generated on creation, stored for email delivery

## 8.3 Security & Privacy

**HTTPS:** Enforced on all routes. HSTS header enabled.

**Environment variables:** All API keys, DB credentials, and secrets in .env.local / Vercel environment variables. Never committed to Git.

**CORS:** API routes restricted to same-origin unless explicitly required otherwise.

**Input sanitisation:** All user inputs sanitised server-side before storage or AI prompt injection.

**Privacy policy:** Required page. Health Check data privacy must be clearly communicated before assessment starts.

**Cookie consent:** GDPR-compliant cookie banner for EU visitors. GA4 consent mode implemented.

**Data retention:** Define and document retention policy for Health Check responses.

## 8.4 Environment Configuration

Required environment variables (.env.local):

ANTHROPIC_API_KEY=

\# Anthropic

ANTHROPIC_API_KEY=

\# Database

DATABASE_URL=

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

\# SMTP / Domain Mail

SMTP_HOST=

SMTP_PORT=465

SMTP_SECURE=false

SMTP_USER=

SMTP_PASSWORD=

SMTP_FROM_NAME=Deni Sawa Partners

SMTP_FROM_EMAIL=<noreply@denisawa.co.ke>

\# Analytics

NEXT_PUBLIC_GA_MEASUREMENT_ID=

\# Site

NEXT_PUBLIC_SITE_URL=https:// denisawa.co.ke

# 9\. Conversion Optimization & Analytics

## 9.1 Key Conversion Events to Track

- Health Check started (Business or Professional)
- Health Check completed
- Basic report viewed
- Full report email sign-up
- "Start Your Assessment" CTA clicked
- "Book a Conversation" form submitted
- "Investor Enquiry" form submitted
- SpecialSit Network application submitted
- Learning & Leadership programme enquiry
- Newsletter / Insights subscription

## 9.2 Google Tag Manager Setup

Implement GTM container on all pages. Configure:

- GA4 base tracking tag
- Custom event triggers for all conversion events listed above
- Scroll depth tracking (25%, 50%, 75%, 100%)
- Outbound link click tracking
- Form submission tracking per form type

_💡 No hardcode GA4 tracking. Route through GTM so tags can be managed without code deployment._

# 10\. Footer Specification

Dark charcoal background (#2C2C2C). Four-column layout on desktop, stacked on mobile.

Column 1 - Brand: Logo (white version), 2-line brand statement, social media icons (LinkedIn, X/Twitter, potentially others).

Column 2 - Services: Links to all Business Support sub-pages.

Column 3 - Platform: Health Checks, Learning & Leadership, Investors, SpecialSit Network, The Method.

Column 4 - Company: About, Leadership, Insights, Contact, Privacy Policy, Terms.

Bottom bar: Copyright © \[Year\] Deni Sawa Partners. All rights reserved. | Privacy Policy | Terms of Use

_💡 Logo in footer must be the white variant or adapted for dark backgrounds. Ensure the full Deni Sawa Partners wordmark is legible._

# 11\. Accessibility Standards

**Standard:** WCAG 2.1 Level AA minimum

**Colour contrast:** All text on background minimum 4.5:1 contrast ratio. Test orange on white, green on white, white on dark.

**Focus states:** Visible keyboard focus on all interactive elements. Use orange focus ring consistently.

**Alt text:** All images have descriptive alt text. Decorative images use alt=""

**Semantic HTML:** Proper heading hierarchy (H1 → H2 → H3). Landmark roles on nav, main, footer.

**Forms:** All fields labelled. Error messages linked to fields. Required fields indicated.

**Skip link:** "Skip to main content" visible on keyboard focus for screen reader users.

# 12\. Pre-Launch Checklist

## 12.1 Content & Design

- All pages reviewed and proofread
- All CTAs working and linked correctly
- All images optimised (WebP, correct dimensions)
- Logo available in colour, white, and dark variants
- OG images created (1200×630) for all major pages
- Favicon created in all required sizes (16, 32, 180, 512)
- 404 page designed and implemented
- Privacy Policy page created
- Terms of Use page created

## 12.2 Technical

- HTTPS enforced
- www redirect configured
- robots.txt at /robots.txt
- sitemap.xml at /sitemap.xml
- All meta titles and descriptions set
- All canonical tags set
- All OG tags set
- Structured data (JSON-LD) implemented and validated in Google Rich Results Test
- GA4 + GTM installed and events firing
- Google Search Console set up and sitemap submitted
- Core Web Vitals passing (test with PageSpeed Insights)
- All forms tested end-to-end including email delivery
- Health Check flow tested on mobile and desktop
- Claude API integration tested (both basic and full report generation)
- Environment variables set in Vercel production environment
- Custom domain configured with SSL
- Cookie consent banner tested

## 12.3 Post-Launch

- Monitor Search Console for crawl errors
- Set up GA4 conversion goals
- Create GTM conversions in Google Ads if running paid campaigns
- Test site on multiple real devices (iOS Safari, Android Chrome, Desktop Chrome, Firefox)
- Share URL across team for final review

# 13\. Final Developer Notes

The website is the most important commercial asset for Deni Sawa Partners in Phase 1. It must communicate authority, clarity, and premium quality from the first second of load.

The Health Check system is the primary lead generation mechanism and must work perfectly. Prioritize this feature in development sequencing.

The LMS is explicitly out of scope for Phase 1. References to it on the Learning page should be "coming soon" with a waitlist capture only.

Every design decision should be tested against this question: "Does this look like a premium international advisory firm?" If the answer is no, revise.

Brand colors must be used consistently and with purpose. Orange for action, transformation, urgency. Green for growth, resilience, trust.

**Deni Sawa Partners - Special Situations → Best-in-Class™**

denisawa.co.ke

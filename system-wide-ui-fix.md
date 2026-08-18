SYSTEM-WIDE CONTENT & UI FIX PROMPT — DENI SAWA PARTNERS

You are working on the existing Deni Sawa Partners Next.js 14 codebase. Apply all the following fixes precisely. Do not rebuild pages from scratch — surgically edit only what is specified.

1. AI Language — System-Wide Replacement

Search the entire codebase including all page files, components, metadata, JSON-LD schema, constants, and any CMS seed data. Replace every instance of AI-referencing language with human-centered alternatives.

Find and replace — exact matches and semantic equivalents:

Remove	Replace with
AI-enabled advisory	Senior-level advisory
AI-enabled fractional business support	Senior-level fractional business support
AI-powered assessment	Structured diagnostic assessment
AI-powered (anywhere)	Structured
AI-generated report	Diagnostic report
AI Diagnostic	Free Diagnostic
AI concierge	Deni Sawa Assistant
AI badge/pill on any widget	Remove badge entirely
Free AI Diagnostic	Free Diagnostic
AI-enabled (anywhere remaining)	Expert-led

Hero subheading — replace entirely:

❌ "AI-enabled advisory and fractional business support helping organisations recover, stabilise, grow and perform at their best."

✅ "Senior advisors and fractional executives helping organisations recover, stabilise, grow and perform at their best."

Footer tagline — replace entirely:

❌ "AI-enabled advisory and fractional business support helping organisations move from Special Situations to Best-in-Class performance."

✅ "Senior-level advisory and fractional business support helping organisations move from Special Situations to Best-in-Class performance."

Health Checks section intro — replace entirely:

❌ "Two AI-powered assessments. A diagnostic report with prioritised recommendations."

✅ "Two structured assessments. A prioritised diagnostic report — used by our advisors as the foundation for your first conversation."

Business Health Check card description:

✅ "A structured assessment of financial health, operations, governance, cashflow and growth readiness."

Professional Financial Health Check card description:

✅ "A structured assessment of personal finances, debt, cashflow, savings and future financial security."

JSON-LD schema description field:

✅ "Senior-level advisory and fractional business support helping organisations move from Special Situations to Best-in-Class performance."

AI Concierge widget header:

✅ "Deni Sawa Assistant · How can we help?"

On the Health Check detail pages only — add this single line where technology is referenced:

"Your responses are analysed and a structured report is prepared, which our advisors use as the foundation for your first conversation."

This is the only place technology is mentioned and it is framed as a tool advisors use — not as the product itself.

2. CTA Language — System-Wide Replacement

Find every instance of "Book a Conversation" across all pages, components, and buttons:

✅ Replace with: "Book a Clarity Call"

Find every instance of "Your first consultation is free" or any variation:

✅ Replace with: "Start with a no-obligation Clarity Call. Confidential. Focused on you."

Final CTA section on homepage — update both lines:

Heading: "Ready to Start?" — keep as is
Subtext: ❌ "Take the first step. No obligation. Confidential."
✅ "Take the first step. One conversation can change the direction of your business."

The two homepage CTA buttons:

Button 1: "Start Your Assessment" — keep orange, keep as is
Button 2: ❌ "Book a Conversation" → ✅ "Book a Clarity Call" — green outline

Apply this same replacement everywhere this button appears: nav, hero, footer, contact page, any service pages.

3. Business Health Score Widget — Homepage Scroll Behaviour

The Business Health Score widget currently sits in a fixed position on the homepage. Implement the following scroll behaviour:

On page load:

The widget is visible centred on screen — large, prominent, above the fold or just within it
It should feel like a feature moment, not a sidebar widget
Display it as a full-width or wide card centred in the hero area or immediately below the hero CTA buttons
Style: white card, 8px radius, subtle orange shadow, score gauge prominent, "72/100 Improving" clearly readable, "Free Diagnostic" CTA button in orange

As user scrolls down:

The widget animates and transitions from its centred position to its current sidebar/inline position using a smooth CSS transform + opacity transition
Use IntersectionObserver to detect when the user has scrolled past the hero section
Once the user passes the hero: widget snaps/transitions to its permanent inline position within the page flow (where it currently sits)
Transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1) + opacity 300ms ease

As user continues scrolling past the widget's inline position:

Widget stays exactly where it is in the page flow — it does not follow the user
It is not sticky beyond its inline position
Normal page scroll continues to the rest of the sections below

Implementation notes:

Use a useRef on the widget and a useRef on the hero section
Track scroll position with IntersectionObserver — no scroll event listeners (performance)
On mobile: skip the centred-on-load behaviour — widget renders in its inline position from the start
Add will-change: transform to the widget element for GPU acceleration
The widget must never overlap nav or other content during transition
4. Homepage In-Page Section Navigation

The /business-support page has an in-page anchor navigation bar listing all sections. Implement the same pattern on the homepage.

Design spec:

Sticky sub-nav bar that appears after the main nav
Only becomes visible once the user scrolls past the hero section (use IntersectionObserver)
Sits just below the main sticky nav — same width as content, not full bleed
Background: white in light mode / 
#111111 in dark mode
1px bottom border 
#E0E0E0 light / 
#333333 dark
Font: Inter 13px, medium weight
Active section: orange text 
#E8510A, orange bottom border 2px
Inactive: 
#666666 text, no border
Smooth scroll to section on click (scroll-behavior: smooth, offset for sticky nav height)

Section links to include (in order):

Overview · Services · Who We Serve · Health Checks · The Method · The Journey · Insights · The Network · Get Started

Anchor IDs to add to each homepage section:

id="overview"        → hero section
id="services"        → Core service / Fractional support section
id="who-we-serve"    → Three audience pathways section
id="health-checks"   → Health Check entry section
id="the-method"      → Deni Sawa Method™ section
id="the-journey"     → Transformation Journey section
id="insights"        → Blog / Recent articles section
id="the-network"     → SpecialSit Network section
id="get-started"     → Final CTA section

Mobile behaviour:

Horizontal scrollable pill row (no wrapping)
Scrolls horizontally so all links are reachable
Same active state logic
Height: 44px (full tap target compliance)

Active section detection:

Use IntersectionObserver with rootMargin: '-30% 0px -60% 0px' to detect which section is in view
Update active link accordingly as user scrolls
5. "Start Your Assessment" CTA — Link to Health Check Section

Every "Start Your Assessment" button across the entire site must link to:

/health-checks#choose-your-assessment

Not just /health-checks. The #choose-your-assessment anchor must scroll the user directly to the section on the Health Checks page where both assessment cards are shown side by side.

On the /health-checks page:

Add id="choose-your-assessment" to the section containing both Health Check cards
Ensure the page scrolls to this section smoothly on load if the hash is present
Offset scroll position to account for sticky nav height (use scroll-margin-top: 80px on the section)
6. Health Checks Page — In-Page Navigation

Add the same in-page anchor navigation bar to /health-checks as implemented on /business-support and now the homepage.

Section links:

Overview · Business Health Check · Professional Health Check · How It Works · What You Get · Start Your Assessment

Anchor IDs:

id="overview"                          → page hero/intro
id="business-health-check"            → Business Health Check card/section
id="professional-health-check"        → Professional Financial Health Check card/section
id="how-it-works"                      → 3-step explainer section
id="what-you-get"                      → Basic vs Full report comparison section
id="choose-your-assessment"           → Both assessment CTA cards (this is the # target from homepage CTAs)

Reduce hero/banner image size on Health Checks page:

Current image appears oversized — reduce to max 320px height on desktop, 200px on mobile
Use object-fit: cover, centred
Add a subtle orange gradient overlay at the bottom edge (linear-gradient(to bottom, transparent 60%, rgba(232,81,10,0.08) 100%))
Ensure the image does not push the assessment cards too far down the page
7. Health Check Start Flow — Direct to Questions

Currently clicking "Start Assessment" on an individual health check takes the user to an intro/detail page. Change this flow:

New flow:

Homepage CTA "Start Your Assessment"
  → /health-checks#choose-your-assessment
     (user sees both cards, chooses one)
         ↓
"Start Assessment" on Business Health Check card
  → /health-checks/business-health-check
     (this page: brief info at top + back link + direct question start)
         ↓
Page auto-focuses / scrolls to Question 1 immediately

On each individual health check page (/health-checks/business-health-check etc.):

Add a slim info bar at the very top of the page (above the question UI):

← Back to Health Checks   |   Business Health Check   |   ~20 min · 5 sections · Confidential
This bar is the only place the check description and back link live
It is compact — max 56px height — does not take up page space
Back link: ← All Health Checks → links to /health-checks
Check name: bold, centred or left-aligned
Meta info: estimated time · number of sections · "Confidential" with a lock icon

Below the info bar: immediately start Question 1

No intermediate "About this check" screen
No large hero image on the individual check pages
No separate "intro" step in the wizard
User lands on the page and Question 1 is the first thing they see and interact with
The name/email/whatsapp capture form IS step 1 of the wizard (not a separate pre-screen)
Progress bar sits just below the info bar, above Question 1

User details capture (step 1 of wizard):

Step 1 of [total]

Tell us about yourself

Full name *
Business name * (Business Health Check only — hide for Professional check)
Email address
WhatsApp number

At least one of email or WhatsApp is required.
Both cannot be empty.

Preferred report delivery:
  ○ Email   ○ WhatsApp   ○ Both

[ Begin Assessment → ]
"Begin Assessment" button is orange, full width on mobile
Validation: full_name required, business_name required for business check, email OR whatsapp required
On submit: POST /api/health-check/start → returns session_id → advance to Question 2
8. Anywhere "Your first consultation is free" appears

Find every instance across all pages, components, metadata, and any hardcoded strings. Replace with:

"Start with a no-obligation Clarity Call. Confidential. Focused entirely on your situation."

Or in shorter contexts where space is limited:

"No obligation. Confidential. Focused on you."

Or on buttons/labels:

"Book a Clarity Call — No Obligation"

Output Order

Apply fixes in this order:

Global find-and-replace: all AI language → human language (system-wide, all files)
Global find-and-replace: "Book a Conversation" → "Book a Clarity Call"
Global find-and-replace: "first consultation is free" variations → new copy
Homepage: Business Health Score widget scroll behaviour
Homepage: in-page section navigation bar
All "Start Your Assessment" CTAs → /health-checks#choose-your-assessment
Health Checks page: in-page navigation + image size reduction + id="choose-your-assessment" anchor
Individual health check pages: slim info bar + remove intro screen + direct to Question 1
Final CTA section copy updates

Do not rebuild any page. Surgical edits only. Show each changed file with the specific lines modified.
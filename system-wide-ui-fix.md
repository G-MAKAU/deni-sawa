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
PRIVACY POLICY, TERMS OF USE & HEALTH CHECK CONSENT — DENI SAWA PARTNERS

You are working on the existing Deni Sawa Partners Next.js 14 codebase. Generate legally grounded, professionally written Privacy Policy and Terms of Use pages specific to Deni Sawa Partners' services, jurisdiction, and data practices. Then integrate consent into the Health Check flow. Surgical edits only — do not rebuild existing pages.

1. Privacy Policy Page — /privacy

Generate a complete, professionally written Privacy Policy. It must be specific to Deni Sawa Partners — not a generic template. Every clause must reflect the actual data practices of this platform.

Company Identity
Business name:     Deni Sawa Partners
Country:           Kenya
Primary contact:   advisory@denisawa.co.ke
Phone:             +254 702 448 601
Website:           https://deni-sawa.vercel.app
Effective date:    [current date on generation]
Governing Law
Primary: Kenya Data Protection Act, 2019 (DPA 2019) and the Kenya Data Protection (General) Regulations, 2021
Secondary: GDPR principles applied as best practice for international users
Data Protection Officer contact: advisory@denisawa.co.ke
Data We Collect — be specific to this platform

Health Check assessments:

Full name
Business name (Business Health Check only)
Email address
WhatsApp number
Assessment responses (paragraph answers, single and multi-select choices)
IP address and user agent (for rate limiting and security)
Time taken to complete the assessment
Assessment start and completion timestamps

Report delivery:

Preferred delivery channel (email, WhatsApp, or both)
Report access timestamp (when report URL is opened)
Report type accessed (summary or detailed)

Communications:

Email correspondence via SMTP (domain mail — no third-party email provider)
WhatsApp messages via Meta Business Cloud API
Contact form submissions

Website usage:

Google Analytics 4 (GA4) data: page views, session duration, events, device type
Cookie consent preferences
Referral source

Admin and team:

Admin user accounts: name, email, role, last active timestamp
Session activity for security (inactivity timeout enforcement)
How We Use Data — specific clauses
To deliver Health Check reports — assessment responses are processed to generate a structured diagnostic report. Reports are delivered to the email address or WhatsApp number provided.
To provide fractional advisory and business support services — contact details and assessment data inform advisory engagements.
To communicate with you — confirmation messages, report delivery, follow-up communications via email and WhatsApp.
To improve our services — anonymised, aggregated assessment data may be used to improve diagnostic accuracy and service design. No individual is identifiable in this analysis.
For security and fraud prevention — IP addresses and session data are used solely to enforce rate limits and prevent abuse of the assessment system.
For analytics — website usage data via GA4 is used to understand how visitors use the site and improve the user experience.
AI Processing — honest and specific

Include a dedicated section titled "How Your Assessment Data is Processed":

"When you complete a Health Check assessment, your responses are submitted to Anthropic's Claude API — a third-party AI service operated by Anthropic, PBC (USA) — to generate your diagnostic report. Your responses are processed by this service for the sole purpose of generating your report. Anthropic's data processing is governed by their privacy policy, available at anthropic.com/privacy. We do not use your assessment responses to train AI models. Your report is stored securely in our database and accessible only via your unique, private report link."

Data Retention
Data type	Retention period
Health Check session and responses	24 months from completion date
Health Check reports	36 months from generation date
Email and WhatsApp logs	12 months
Contact form submissions	24 months
GA4 analytics data	Per GA4 default (14 months)
Admin session logs	6 months

After retention periods, data is permanently deleted from all systems including backups within 30 days of the retention date.

Data Sharing — be specific

We share data only with:

Anthropic, PBC — assessment responses sent to Claude API for report generation only
Meta Platforms — WhatsApp number and message content sent via Meta Business Cloud API for report delivery (only when WhatsApp delivery is selected)
Supabase, Inc. — our database and authentication provider. Data is stored in Supabase-managed PostgreSQL infrastructure
Google LLC — anonymised analytics data via Google Analytics 4
Vercel, Inc. — our hosting provider. No user data is stored by Vercel beyond standard server logs

We do not sell, rent, or share personal data with any third party for marketing purposes. Ever.

User Rights under Kenya DPA 2019

Users have the right to:

Access their personal data
Correct inaccurate data
Delete their data (right to erasure)
Object to processing
Data portability
Withdraw consent at any time

To exercise any right: email advisory@denisawa.co.ke with subject line "Data Rights Request — [your name]". We will respond within 21 days as required by the Kenya DPA 2019.

Cookies
Cookie	Purpose	Duration
ds_admin_last_active	Admin session inactivity timeout	Session
_ga, _ga_*	Google Analytics 4	2 years
sb-*	Supabase authentication	Session
Cookie consent preference	Remembers your consent choice	12 months

Users can withdraw cookie consent at any time via the cookie settings link in the footer.

Health Check Report Links

Report links (/health-checks/report/[token]) are private and unique. The token is a 64-character cryptographic random string. Anyone with the link can access the report — users are advised not to share their report link with unintended recipients.

Changes to This Policy

We will notify users of material changes via email (if provided) and by posting the updated policy on this page with a revised effective date. Continued use of the platform after changes constitutes acceptance.

Page Design
Clean, readable, no hero image
Table of contents with anchor links at the top (jump to each section)
Section headings in green 
#5A9E28
Last updated date prominent below the page title
"Download as PDF" button (orange) — generates a clean PDF of the policy
Mobile: full single-column, generous padding
Max content width: 800px centred
2. Terms of Use Page — /terms

Generate a complete, professionally written Terms of Use document specific to Deni Sawa Partners.

Sections to include

1. Acceptance of Terms
By accessing or using the Deni Sawa Partners website or completing a Health Check assessment, you agree to these Terms. If you do not agree, do not use the platform.

2. About Deni Sawa Partners
Describe the platform: strategic advisory and fractional business support. Not a law firm, accounting firm, or financial services licensee in the regulatory sense. Advisory services are professional guidance — not regulated financial advice under the Capital Markets Authority (Kenya) or any equivalent body.

3. Health Check Assessments — specific terms

Include all of the following:

Health Check assessments are diagnostic tools designed to provide structured insight into business or personal financial situations
Results are indicative only and do not constitute professional financial, legal, tax, or investment advice
The diagnostic report is generated using an AI language model (Anthropic Claude) based on your responses. The accuracy and relevance of the report depends on the accuracy and completeness of your responses
Deni Sawa Partners advisors may review reports as part of a follow-up engagement but are not obligated to do so for free summary reports
The detailed (paid) report is for your personal or business use only — you may not resell, republish, or distribute the report
Rate limits apply: a maximum of 5 assessments per email address, WhatsApp number, or IP address per calendar month. This limit may be adjusted at Deni Sawa Partners' discretion
Deni Sawa Partners reserves the right to refuse, suspend, or terminate access to the assessment system for any user who attempts to abuse, circumvent, or manipulate the assessment process

4. Report Access and Security

Your report is accessible via a unique private link
You are responsible for keeping your report link private
Deni Sawa Partners cannot be held responsible for unauthorised access to a report resulting from a user sharing their report link
Reports are stored for 36 months and then permanently deleted

5. Paid Reports

Detailed (full) reports require payment before delivery
Payment terms and pricing are as listed on the platform at the time of purchase
Refunds: if a report fails to generate due to a technical error, a full refund will be issued. No refund is available once a report has been successfully generated and delivered
Deni Sawa Partners reserves the right to change pricing at any time

6. Intellectual Property

All content on this website including text, design, methodology (Deni Sawa Method™), and reports generated by the platform are the intellectual property of Deni Sawa Partners
The Deni Sawa Method™ is a proprietary framework. Unauthorised reproduction or commercial use is prohibited
Your assessment responses remain your own data. By submitting them, you grant Deni Sawa Partners a limited licence to process them for the purpose of generating your report and improving the diagnostic system (in anonymised, aggregated form only)

7. Limitation of Liability

Deni Sawa Partners provides the platform and advisory services in good faith
We are not liable for any business decisions made in reliance on a Health Check report or any advisory engagement
Our total liability to any user is limited to the amount paid for the service that gave rise to the claim
We are not liable for indirect, consequential, or loss of profit claims

8. WhatsApp Communication

By providing your WhatsApp number, you consent to receive your Health Check report and related communications via WhatsApp
You can opt out at any time by replying STOP to any WhatsApp message or by emailing advisory@denisawa.co.ke

9. Governing Law

These Terms are governed by the laws of Kenya
Any dispute shall be subject to the exclusive jurisdiction of the courts of Nairobi, Kenya
We will always attempt to resolve disputes amicably before any legal process

10. Contact
For any queries regarding these Terms: advisory@denisawa.co.ke

Page Design

Same design as Privacy Policy page — consistent layout, table of contents, green headings, last updated date, PDF download button.

3. Health Check Consent Integration

Update the Health Check wizard Step 1 (user details capture) to include consent before the user can begin the assessment.

Step 1 form — add consent block

Place the consent block below the name/email/WhatsApp fields and above the "Begin Assessment" button.

┌─────────────────────────────────────────────────────────┐
│  By starting this assessment you confirm that you have  │
│  read and agree to our:                                 │
│                                                         │
│  [☐] Privacy Policy  and  Terms of Use         *       │
│                                                         │
│  Your responses will be used to generate your           │
│  diagnostic report. Data is handled confidentially      │
│  in accordance with the Kenya Data Protection           │
│  Act, 2019.                                             │
│                                                         │
│  [☐] I consent to receive my report via                 │
│      [email / WhatsApp / both — matches their           │
│       preferred_delivery selection above]      *        │
└─────────────────────────────────────────────────────────┘

Checkbox 1 — Privacy & Terms:

Label: I have read and agree to the [Privacy Policy] and [Terms of Use]
"Privacy Policy" and "Terms of Use" are inline links opening in a new tab
Required: true — cannot submit without checking
Unchecked state: normal border
Attempted submit without checking: red border + error message "You must agree to the Privacy Policy and Terms of Use to continue"
Checkbox colour when checked: orange 
#E8510A

Checkbox 2 — Communications consent:

Label dynamically updates based on preferred_delivery selection:
email selected → "I consent to receive my report and related communications at the email address provided"
whatsapp selected → "I consent to receive my report and related communications via WhatsApp at the number provided"
both selected → "I consent to receive my report and related communications via email and WhatsApp at the details provided"
Required: true
Same validation behaviour as Checkbox 1

Consent record — store in database:

Add the following columns to health_check_sessions table:

sql
ALTER TABLE public.health_check_sessions
  ADD COLUMN IF NOT EXISTS terms_agreed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_agreed_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text,
  -- store which version of terms was agreed to e.g. '2026-08'
  -- so if terms change, historical records show which version user agreed to
  ADD COLUMN IF NOT EXISTS comms_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS comms_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_ip inet;
  -- record IP at time of consent for compliance audit trail

API update — POST /api/health-check/start:

Add to request body schema (Zod):

typescript
terms_agreed: z.literal(true, {
  errorMap: () => ({ message: 'You must agree to the Privacy Policy and Terms of Use' })
}),
comms_consent: z.literal(true, {
  errorMap: () => ({ message: 'You must consent to receive your report' })
})

If either is false → return 400 with error message. Never create a session record without confirmed consent.

On session creation — store:

typescript
terms_agreed: true,
terms_agreed_at: new Date().toISOString(),
terms_version: process.env.TERMS_VERSION ?? '2026-08',
comms_consent: true,
comms_consent_at: new Date().toISOString(),
consent_ip: request_ip

Add TERMS_VERSION=2026-08 to .env.local. Update this string whenever Privacy Policy or Terms of Use are materially changed — creates a clear audit trail of which version each user consented to.

Consent confirmation — display in sessions admin viewer:

In /admin/health-checks/sessions table, add two columns:

"Terms agreed" — green tick or red cross
"Comms consent" — green tick or red cross

In the session detail modal (when admin clicks a row), show:

Terms agreed:       ✓ Yes — [timestamp] — Version 2026-08
Communications:     ✓ Yes — [timestamp]
Consent IP:         [ip address]
4. Footer Updates

Add to footer — legal links row (already has Privacy Policy and Terms of Use links — verify they point to /privacy and /terms correctly)

Add below the existing footer bottom bar:

© 2026 Deni Sawa Partners. All rights reserved.
Deni Sawa Partners provides professional advisory services.
Our services do not constitute regulated financial advice.
Governed by the laws of Kenya.

Add cookie settings link in the footer bottom bar:

Privacy Policy  |  Terms of Use  |  Cookie Settings  |  Investor & Partner Enquiries

"Cookie Settings" opens the cookie consent modal allowing users to review and change their preferences.

5. Cookie Consent Banner

Implement a GDPR/Kenya DPA compliant cookie consent banner if not already present.

Design:

Slides up from the bottom of the screen on first visit
Dark charcoal 
#2C2C2C background, white text
Max width 600px on desktop, full width on mobile, centred
Rounded top corners 8px
Shadow above

Content:

We use cookies to improve your experience and analyse site usage.
Read our [Privacy Policy] for details.

[ Accept all ]   [ Essential only ]   [ Manage preferences ]
"Accept all" → orange button
"Essential only" → green outline button
"Manage preferences" → text link, opens preferences modal

Preferences modal:

Three toggles:
Essential cookies (always on, cannot toggle off)
Analytics cookies (GA4) — off by default until accepted
Communications cookies — off by default

Storage:

Save preference to localStorage key ds_cookie_consent
Value: { essential: true, analytics: boolean, comms: boolean, timestamp: ISO string, version: '2026-08' }
Re-show banner if version in stored preference does not match current version

GA4 consent mode:

Only initialise GA4 if analytics: true in stored consent
Use GA4 Consent Mode v2: set analytics_storage: 'granted' or 'denied' accordingly
6. Environment Variable

Add to .env.local:

env
TERMS_VERSION=2026-08

Update this value whenever Privacy Policy or Terms of Use are materially amended.

Output Order
/app/privacy/page.tsx — full Privacy Policy page
/app/terms/page.tsx — full Terms of Use page
SQL migration — ALTER TABLE health_check_sessions ADD COLUMN statements
Updated Zod schema for POST /api/health-check/start
Updated API route /api/health-check/start with consent storage
Updated Health Check Step 1 component with consent checkboxes
Cookie consent banner component
Cookie preferences modal component
Updated footer with new legal line and cookie settings link
Updated /admin/health-checks/sessions table and detail modal with consent columns

Surgical edits only. Show each changed file with specific lines modified. No placeholder comments.
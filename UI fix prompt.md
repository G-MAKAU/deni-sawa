You are working on the existing Deni Sawa Partners Next.js 14 codebase. Apply all changes below precisely. Do not rebuild pages from scratch — surgically implement only what is specified.

In main nav, what to be changed only is the Services Dropdown. Services dropdown  to entail: 
01  Professionals & Individuals     →  /services/professionals

    Financial Health → Resilience → Leadership

02  Entrepreneurs & Founders        →  /services/entrepreneurs

    Stability → Structure → Growth → Best-in-Class

03  Investors                        →  /services/investors

    Visibility → Governance → Accountability → Portfolio Performance

04  Business Health Checks          →  /health-checks

    Know Your Status → Diagnose → Take Action

05  Learning & Programs             →  /services/learning

    Learn → Apply → Lead → Transform




Section 6. SERVICES HUB PAGE — /services (NEW PAGE)

Create this page. It is the main Services landing page linked from the nav.

Page hero:

Eyebrow: Services
H1: Five Ways We Can Help
Subtext: Three client pathways, one diagnostic platform and one learning ecosystem — structured around where you are and where you need to go.

In-page anchor navigation (same sticky pattern as business-support page):

Overview · Professionals · Entrepreneurs · Investors · Health Checks · Learning & Programs

Anchor IDs:

#overview
#professionals
#entrepreneurs
#investors
#health-checks
#learning

Five category sections (in order):

Each category follows this layout:

Category number (orange, large, monospace)
Category name (H2)
Positioning tagline (green, italic)
2–3 sentence description
Three sub-service cards (A, B, C from the document)
Outcomes line
Primary CTA button
Section 01 — Professionals & Individuals (id="professionals")
01
Professionals & Individuals
Financial Health → Resilience → Leadership

We help professionals and individuals build greater financial clarity, resilience and confidence.

Three sub-service cards:

A. Financial Resilience
- Professional Financial Health Assessment
- Financial recovery planning
- Debt and cashflow support
- Budgeting and savings discipline

B. Learning & Leadership
- Financial resilience learning
- Executive Finance for Non-Finance Leaders
- Leadership and decision-making development

C. Mentorship & Accountability
- 1:1 mentorship
- Group accountability
- Financial wellness and leadership support

Outcomes strip:

Greater financial clarity  |  Stronger resilience  |  Better decisions  |  Leadership confidence

CTA: Take Professional Financial Health Check → /health-checks/professional-financial-health-check

Section 02 — Entrepreneurs & Founders (id="entrepreneurs")
02
Entrepreneurs & Founders
Stability → Structure → Growth → Best-in-Class

Our core business support pathway for founders and owners who need stronger financial discipline, governance, execution and growth support.

Three sub-service cards:

A. Fractional / Part-Time Business Support
- Fractional CFO / Financial Leadership
- Fractional CEO / Strategic Leadership
- Cashflow & working capital
- Management reporting and performance
- Governance, controls and KPIs

B. Business Recovery & Growth
- Business Health Check and diagnostics
- Recovery and restructuring support
- Growth strategy
- Business model and revenue review
- Strategic partnerships and investor readiness

C. Leadership, Governance & Accountability
- Founder mentorship
- Governance implementation
- KPI and accountability systems
- Executive Finance for Non-Finance Leaders
- LMS-supported learning

Outcomes strip:

Stable operations  |  Better cashflow  |  Stronger governance  |  Reduced founder dependency  |  Scalable growth  |  Investment readiness

Primary CTA: Take Business Health Check → /health-checks/business-health-check
Secondary CTA: Discuss Fractional Support → /contact

Section 03 — Investors (id="investors")
03
Investors
Visibility → Governance → Accountability → Portfolio Performance

We support investors seeking stronger visibility, governance and execution discipline across SME and growth-business investments.

Three sub-service cards:

A. Investor Readiness
- Investment readiness assessment
- Business and financial readiness
- Management information and reporting
- Governance readiness

B. Portfolio Oversight
- Portfolio performance monitoring
- KPI and milestone tracking
- Financial and cashflow monitoring
- Governance and founder accountability

C. Investor Advisory & Representation
- Independent investor representation
- Risk identification and escalation
- Investor reporting and governance monitoring
- Post-investment oversight

Outcomes strip:

Investment visibility  |  Governance standards  |  Founder accountability  |  Portfolio performance

CTA: Investor & Partner Enquiry → /contact

Section 04 — Business Health Checks (id="health-checks")
04
Business Health Checks
Know Your Status → Diagnose → Take Action

Health Checks are the diagnostic entry point into the Deni Sawa ecosystem. Assessment results can guide clients toward self-learning, mentorship, advisory or Fractional / Part-Time Support.

Two cards:

Business Health Check
A structured assessment covering financial health, cashflow, operations, governance and growth readiness.
CTA: [Take the Business Health Check]

Professional Financial Health Check
A structured assessment covering income, debt, cashflow, savings and future financial security.
CTA: [Take the Professional Financial Health Check]

Note below cards:

Detailed reports or clarity sessions can be offered separately following assessment completion.
Section 05 — Learning & Programs (id="learning")
05
Learning & Programs
Learn → Apply → Lead → Transform

Practical programmes, digital learning and structured development designed to build financial, business and leadership capability.

Five sub-sections:

A. Learning Management System (LMS)
The digital learning environment for structured courses, tools, progress tracking and accountability.
- Structured learning pathways
- Interactive courses and resources
- Assessments and progress tracking
- Dashboards and accountability
- Certificates where applicable
CTA: [Access the Learning Centre]  →  /lms  (placeholder — Phase 2)

B. Deni Sawa Method™
A structured approach for moving from pressure and uncertainty toward sustainable performance.
- Diagnose — Understand the real situation
- Evaluate — Determine priorities, risks and opportunities
- Negotiate — Develop workable solutions
- Implement — Turn decisions into disciplined action
- Sustain — Embed systems and accountability
CTA: [Explore the Deni Sawa Method]  →  /deni-sawa-method

C. Executive Finance & Leadership Programs
Practical executive finance for leaders who are not accountants. No accounting background required.
- Understand financial statements and business performance
- Make better cashflow and profitability decisions
- Use budgets, KPIs and management reports
- Strengthen financial controls and governance
- Connect finance to leadership and strategy
CTA: [Explore Executive Finance]  →  /services/learning#executive-finance

D. SpecialSit Network
A wider community for entrepreneurs, professionals, investors and strategic partners seeking peer learning, accountability, mentorship and connections.
CTA: [Visit the SpecialSit Network]  →  /specialsit-network
Note: Keep this section compact. Full SS-N detail lives on the dedicated SS-N page. Do not duplicate membership or forum details here.

E. Other Programs (compact card row)
Display as small placeholder cards — "Coming Soon" state:
- Business Recovery
- Governance
- Financial Resilience
- Entrepreneurship & Growth
- Investor Readiness
7. INDIVIDUAL SERVICE CATEGORY PAGES

Create three new pages. Each follows the same layout template. Build a shared ServiceCategoryLayout component to avoid duplication.

Page template structure:
1. Slim eyebrow bar: [← Back to Services]  |  [Category Name]  |  [Positioning tagline]
2. Page hero: Category number (large orange) + H1 + tagline + primary CTA
3. In-page anchor nav: Sub-section A | Sub-section B | Sub-section C | Outcomes | Get Started
4. Three sub-service sections (A, B, C) with full bullet lists
5. Outcomes strip
6. CTA section
/services/professionals — Professionals & Individuals

Use all content from Section 6 above (Service Category 01). Full bullet lists for A, B, C. Outcomes strip. Primary CTA: Take Professional Financial Health Check.

/services/entrepreneurs — Entrepreneurs & Founders

Use all content from Section 6 above (Service Category 02). Full bullet lists for A, B, C. Outcomes strip. Primary CTA: Take Business Health Check. Secondary: Discuss Fractional Support.

/services/investors — Investors

Use all content from Section 6 above (Service Category 03). Full bullet lists for A, B, C. Outcomes strip. Primary CTA: Investor & Partner Enquiry.

/services/learning — Learning & Programs

Use all content from Section 6 above (Service Category 05). Sub-sections A–E. CTA per sub-section. LMS links are placeholder (/lms) — Phase 2.

8. TRANSFORMATION JOURNEY — GLOBAL UPDATE

The transformation journey currently reads:

Recovery → Resilience → Growth → Best-in-Class

Update everywhere this appears across all pages, components, footers, and metadata to:

Recovery → Resilience → Growth → Sustainability → Best-in-Class

Perform a global search across the codebase for all instances of the journey string and update each one. This includes:

Homepage Journey section
Homepage hero strip
Footer tagline if present
Individual service pages
Health Check pages
Any constants or config files storing this string
JSON-LD schema if referenced

9. DESIGN CONSISTENCY RULES FOR ALL NEW PAGES

Apply these rules to every new page and component created in this prompt:

Category numbers:

Font: JetBrains Mono
Size: 11px uppercase on cards, 64–80px display size on page heroes
Colour: 
#E8510A

Positioning taglines (journey arrows):

Colour: 
#5A9E28
Font: Inter, italic, 15px
Arrow → character — never an SVG icon

Sub-service cards (A, B, C):

White background, 1px 
#E0E0E0 border, 8px radius
Top left: letter label (A, B, C) in orange pill
Title: Inter semibold 17px
Bullets: ChevronRight Lucide icon in orange, 13px, custom bullet
Hover: translateY(-2px) + shadow, 200ms ease

Outcomes strip:

Full-width dark charcoal 
#2C2C2C background
Items separated by | dividers
White text, Inter medium 14px
Orange | divider character

Back link bar (individual service pages):

Same slim 56px bar pattern as Health Check pages
← Back to Services links to /services

LMS Login button (nav):

Green outline ghost button
When LMS is Phase 2 / not built: clicking shows a small tooltip "Coming Soon — Learning Centre launching soon" rather than a 404
Do not link to a broken page. New pages to be well implemented and unused pages removed. Once done dont push to repo
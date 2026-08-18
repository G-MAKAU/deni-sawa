# Deni Sawa Partners — UI/UX 9.5 Improvement Plan & Implementation Prompt

## Purpose

This document captures the recommendations for taking the current Deni Sawa Partners website from an already strong UI/UX level to a **9.5/10 premium digital advisory experience**.

This is **not a redesign-from-scratch brief**. The current architecture, content model, Health Check system, imagery, and animation system should be preserved unless the analysis proves that a specific change is necessary.

The implementation agent must first **learn and inspect the existing system**, then produce a plan, and **only after presenting that plan ask the user which improvements they want implemented**.

---

# 1. Current System — Important Context

The current live Deni Sawa site positions the company around:

> **From Special Situations to Best-in-Class**

The site describes Deni Sawa as an AI-enabled advisory and fractional business-support firm helping organisations recover, stabilise, grow and perform at their best.

Current major areas include:

- Business Support
- Fractional CFO
- Fractional CEO
- Governance & Business Controls
- Growth & Business Development
- Special Situations Support
- Business Health Check
- Professional Financial Health Check
- Learning & Leadership
- Investors
- SpecialSit Network
- The Deni Sawa Method™
- Blog & Insights
- Deni Sawa Assistant

The homepage currently communicates the journey:

**Recovery → Resilience → Growth → Best-in-Class**

and the Deni Sawa Method™:

**Diagnose → Evaluate → Negotiate → Implement → Sustain**

The site also has the transformation path:

**Identify → Assess → Understand → Choose → Implement → Transform**

## Critical clarifications

### Business Health Score

The **Business Health Score is intentionally dynamic/decorative**.

It moves **up or down randomly** and cycles between the three displayed states:

- Fragile
- Stable
- Resilient

Do **NOT** replace this with a real calculated score unless explicitly instructed.

Do **NOT** redesign it into a real diagnostic dashboard.

Do **NOT** imply that the homepage score represents a visitor's actual business.

It is a visual/brand interaction intended to communicate the idea of business health assessment.

### Health Checks

The Health Checks are **already implemented as a working database-backed system**.

There are two existing assessments:

1. Business Health Check
2. Professional Financial Health Check

They already have:

- database-backed questions/data
- assessment flows
- report generation
- AI integration
- report handling
- existing application logic

The Health Check cards also already have **dedicated imagery**, visible on:

`https://deni-sawa.vercel.app/health-checks`

The implementation agent must **not recreate, replace, or fake the Health Check system**.

Before proposing changes, inspect how the existing Health Check system actually works.

### Animations

Animations are **already implemented**.

Do NOT recommend "add animations" as a generic improvement.

Instead, inspect the existing animation implementation and determine whether:

- timing is consistent
- easing feels premium
- animation hierarchy is intentional
- motion is excessive anywhere
- transitions support UX
- mobile performance is acceptable
- animations are being repeated unnecessarily

The goal is **motion refinement**, not simply adding more animation.

---

# 2. Current UI/UX Assessment

Target assessment:

## Current estimated level: 8.7/10

## Target: 9.5/10

The difference should come from:

- stronger visual hierarchy
- clearer user routing
- more intentional information architecture
- stronger premium/advisory positioning
- better use of existing Health Check infrastructure
- improved visual storytelling
- stronger proof/trust presentation
- reduction of repetitive card layouts
- refined motion
- more deliberate mobile UX
- tighter conversion paths

---

# 3. Priority Recommendations

## P0 — Highest Priority

These should be investigated first.

### A. Make the Health Check journey feel like the core product

The Health Checks should not feel like ordinary website forms.

The experience should communicate:

**Assessment → AI Analysis → Health Score → Findings → Priorities → Recommendations → Report → Recommended Pathway**

The existing Health Check implementation must remain intact.

Improve the surrounding UX and presentation without breaking the underlying database/application logic.

The goal is for the visitor to understand:

> "Deni Sawa can diagnose my situation and tell me what I should do next."

---

### B. Make the user-routing journey clearer

The site currently serves:

- Professionals & Individuals
- Entrepreneurs & Founders
- Investors

Improve the UX so users can quickly understand:

**Who am I? → What situation am I in? → Which assessment/pathway applies to me?**

Possible UX direction:

**Which describes you?**

- Personal / Professional
- Business / Founder
- Investor / Partner

Then guide the visitor toward the relevant next action.

Do not implement this automatically. First inspect the current navigation and conversion flow and propose the least disruptive approach.

---

### C. Strengthen the visual narrative

The most important brand narrative is:

**Special Situations → Recovery → Resilience → Growth → Best-in-Class**

This should become a stronger visual storytelling system throughout the experience.

The goal is not to duplicate the same text repeatedly.

Instead, create a coherent visual progression.

---

# 4. Hero Section — Premium Refinement

The existing hero is already conceptually strong.

Current positioning:

> From Special Situations to Best-in-Class

Supporting message:

> AI-enabled advisory and fractional business support helping organisations recover, stabilise, grow and perform at their best.

Existing visual:

**Business Health Score**

The hero should feel more like a **premium advisory institution** and less like a conventional SaaS landing page.

Potential improvements:

- stronger editorial typography
- improved balance between headline and visual
- more deliberate whitespace
- stronger CTA hierarchy
- refined Business Health Score presentation
- subtle data/diagnostic visual language
- better relationship between headline, score and supporting imagery
- stronger desktop composition
- deliberate mobile composition

Do not remove the existing Business Health Score.

Do not turn the random score into a real score.

---

# 5. Business Health Score — Refine, Don't Replace

The score currently communicates:

**72/100 — Resilient**

and moves randomly between states.

States:

- Fragile
- Stable
- Resilient

Recommended improvements:

- make the animation feel intentional rather than arbitrary
- smooth the transitions
- ensure the state change is visually legible
- ensure the score and label remain synchronized
- improve typography hierarchy
- improve visual relationship between score, state and "AI"
- avoid implying that this is an actual visitor diagnosis
- ensure accessibility
- ensure no distracting motion on mobile or reduced-motion environments

The random behaviour is a deliberate existing feature and must remain unless the user explicitly requests a change.

---

# 6. Reduce the "Card Wall"

The site contains many strong card-based sections.

The problem is not that cards are bad.

The problem is that if every section is represented as cards, the visual language becomes predictable.

Improve variety through:

- editorial layouts
- large typography
- asymmetric compositions
- full-width sections
- image-led sections
- interactive diagrams
- whitespace
- large single-feature moments
- selective cards only where users need to choose between options

Do not remove cards merely for the sake of removing them.

Each component should have a clear UX purpose.

---

# 7. Deni Sawa Method™ — Make It a Signature Component

The existing methodology:

**D — Diagnose**
Understand the real situation.

**E — Evaluate**
Determine priorities, risks and opportunities.

**N — Negotiate**
Create workable solutions.

**I — Implement**
Put the recovery or growth plan into action.

**S — Sustain**
Build systems that prevent regression and support long-term performance.

Potential UX refinement:

A horizontal or scroll-driven methodology experience:

`D → E → N → I → S`

Each stage could reveal:

- definition
- objective
- example
- corresponding service/action

The implementation should remain subtle and premium.

Do not over-animate it.

---

# 8. Recovery → Resilience → Growth → Best-in-Class

This is the site's strongest strategic narrative.

Potential visual treatment:

### Recovery
Stabilise the situation.

### Resilience
Build systems and buffers.

### Growth
Build deliberately.

### Best-in-Class
Make performance compound.

Use this as a visual journey rather than repeatedly presenting it as ordinary text.

Potential techniques:

- scroll progression
- typography transitions
- connected line/diagram
- subtle stage transitions
- visual progression
- carefully chosen imagery

The exact implementation must be planned after inspecting the current code.

---

# 9. Who We Serve

Current pathways:

### Professionals & Individuals
Financial Health → Resilience → Leadership

### Entrepreneurs & Founders
Stability → Structure → Growth → Best-in-Class

### Investors
Visibility → Governance → Accountability → Portfolio Performance

Improve clarity and interaction.

Possible approach:

> Which describes you?

Then reveal the relevant path.

The implementation should avoid adding friction.

If the current three-card presentation already converts well, consider progressive enhancement rather than replacement.

---

# 10. Health Checks Page

The existing Health Checks page already contains the two assessments, dedicated images and detailed information.

Current page structure includes:

- Health Checks introduction
- Business Health Check
- Professional Financial Health Check
- How it works
- Basic vs Full report explanation
- Data confidentiality
- CTA

The existing images are part of the system and should be retained unless there is a demonstrable design problem.

Potential improvements:

- stronger visual hierarchy
- stronger distinction between the two assessments
- better assessment selection UX
- clearer explanation of what happens after submission
- stronger preview of the resulting report
- stronger relationship between assessment and recommended next step
- premium presentation of the free/full report distinction
- better mobile layout
- stronger conversion CTA

Do not modify the underlying database or assessment logic without first understanding it.

---

# 11. Report Experience

The Health Check system generates AI diagnostic reports.

The current page communicates:

- AI-generated diagnostic report
- executive summary
- top priority callouts
- category findings
- recommendations
- PDF & Word export
- private emailed link

Potential improvement:

Make the report feel like a **Deni Sawa Diagnostic Report**, not merely an AI-generated document.

Potential visual hierarchy:

**Overall position**

↓

**Executive summary**

↓

**Top 3 priorities**

↓

**Category findings**

↓

**Recommended actions**

↓

**Suggested Deni Sawa pathway**

The implementation agent must inspect the existing report system before proposing any changes.

---

# 12. Proof & Credibility

This is one of the strongest opportunities for reaching 9.5.

The site offers serious services:

- Fractional CFO
- Fractional CEO
- Governance
- Growth
- Special Situations
- Investor Readiness

These require high trust.

Consider adding stronger evidence:

- anonymised case studies
- sector examples
- measurable outcomes where available
- experience
- leadership credentials
- selected engagements
- partner/investor proof
- testimonials if legitimate and approved

Do not fabricate results, clients or credentials.

If proof is unavailable, recommend what information the owner should provide.

---

# 13. SpecialSit Network

Current positioning:

> The relationship layer of the Deni Sawa ecosystem

It includes:

- Peer Forums
- Mentorship
- Investor Connections

Potential improvement:

Make it visually feel like a **private professional network**, not another generic website section.

Possible language hierarchy:

**SpecialSit Network**

> A curated network for people navigating complex situations.

Then:

**Peers · Mentors · Capital · Accountability**

Do not over-design this section.

---

# 14. Blog & Insights

The current site includes featured articles.

Potential improvement:

Position this as:

**Deni Sawa Intelligence**

or an equivalent approved brand direction.

Use:

- one dominant featured article
- supporting articles
- clearer category labels
- better reading-time presentation
- stronger editorial typography

Do not change the existing content strategy without approval.

---

# 15. Navigation

Current navigation includes:

- Partners
- Services
- Health Checks
- Learning
- SpecialSit Network
- About
- Contact
- Start Your Assessment

The primary conversion action should remain highly visible.

Potential hierarchy:

**Services | Health Checks | Learning | Network | About**

with:

**Start Your Assessment**

as the strongest CTA.

Do not change navigation blindly.

First inspect:

- current desktop nav
- mobile nav
- dropdown behaviour
- scroll behaviour
- CTA prominence
- route structure
- page hierarchy

---

# 16. AI Assistant

The current Deni Sawa Assistant is positioned as:

> AI concierge · From Special Situations to Best-in-Class

It already contains guided topics for:

- Health Checks
- Business Support
- Learning & Network
- Getting Started

Potential improvement:

Make it more of a **journey concierge**.

Possible first question:

> What brings you here?

Potential choices:

- I'm dealing with a difficult situation
- I want to grow my business
- I need better financial visibility
- I'm exploring investment
- I want to improve my financial health

Then route the user to relevant content or Health Check.

Do not implement this until the current assistant architecture and backend are inspected.

---

# 17. Animation & Motion

Animations already exist.

Therefore the objective is:

## Motion refinement, not more motion.

Inspect:

- Framer Motion / CSS / GSAP / other animation system
- animation duration
- easing
- viewport triggers
- repeated animations
- page-load animation
- scroll animations
- hover animations
- mobile behaviour
- reduced-motion support
- layout shift
- performance

Potential improvements:

- standardise motion tokens
- remove redundant animations
- improve easing
- stagger only where useful
- avoid excessive movement
- preserve accessibility
- make transitions reinforce hierarchy

---

# 18. Mobile UX

Perform a dedicated mobile UX review.

Do not merely verify responsiveness.

Review:

- hero hierarchy
- Business Health Score
- navigation
- CTA placement
- service sections
- Health Check cards
- methodology
- transformation journey
- SpecialSit Network
- blog
- AI Assistant
- footer

Ask:

> Does this feel intentionally designed for mobile?

rather than:

> Does this technically fit on mobile?

---

# 19. Accessibility

Before calling the work complete, inspect:

- keyboard navigation
- focus states
- contrast
- semantic headings
- button/link semantics
- alt text
- form labels
- reduced motion
- screen-reader clarity
- touch targets
- error states

Do not sacrifice accessibility for visual effects.

---

# 20. Performance

Inspect before modifying:

- image loading
- image dimensions
- image formats
- lazy loading
- font loading
- JavaScript bundles
- client components
- hydration
- animation overhead
- unnecessary API calls
- Health Check assets
- AI Assistant loading

The target is a premium feel **without sacrificing performance**.

---

# 21. Design System Consistency

Inspect and document:

- colours
- typography
- spacing
- radii
- shadows
- borders
- buttons
- cards
- icons
- badges
- motion
- breakpoints

Then identify inconsistencies.

Do not introduce an entirely new design system unless the existing one is fundamentally inadequate.

---

# 22. Recommended 9.5 Information Architecture

A potential ideal homepage journey:

1. **Hero**
   - From Special Situations to Best-in-Class
   - Start Your Assessment
   - Business Health Score visual

2. **Who Are You?**
   - Professional / Individual
   - Founder / Business
   - Investor / Partner

3. **Diagnose**
   - Health Check entry point

4. **Your Journey**
   - Recovery → Resilience → Growth → Best-in-Class

5. **How We Help**
   - Fractional CFO
   - Fractional CEO
   - Governance
   - Growth
   - Special Situations

6. **The Deni Sawa Method™**
   - Diagnose → Evaluate → Negotiate → Implement → Sustain

7. **Proof**
   - Experience / Case Studies / Outcomes

8. **SpecialSit Network**
   - Peers / Mentors / Capital / Accountability

9. **Deni Sawa Intelligence**
   - Featured insights

10. **Final CTA**
   - Start Your Assessment
   - Book a Conversation

This is a target model, not an instruction to blindly restructure the site.

---

# 23. What NOT To Do

The implementation agent must NOT:

- rebuild the website from scratch
- replace the existing Health Check system
- replace the Health Check database
- invent Health Check data
- turn the random Business Health Score into a real score
- remove the three Business Health Score states
- replace existing Health Check imagery without reason
- add animations simply because animations were recommended earlier
- fabricate testimonials
- fabricate case studies
- fabricate business outcomes
- invent credentials
- change business positioning without approval
- remove major functionality without approval
- introduce unnecessary dependencies
- rewrite working backend systems unnecessarily
- change database schemas without a concrete need
- blindly refactor large parts of the application
- assume the old Deni Sawa website/content is still relevant
- treat this document as permission to implement every recommendation

---

# 24. Implementation Philosophy

The target is:

> **A premium digital advisory institution — not a flashy marketing website.**

The experience should feel:

- authoritative
- calm
- intelligent
- trustworthy
- modern
- strategic
- human
- premium
- deliberate

Avoid:

- excessive gradients
- excessive glassmorphism
- unnecessary 3D
- excessive animations
- generic SaaS layouts
- visual clutter
- too many CTAs
- repetitive cards
- fake data
- AI-looking UI

---

# 25. MASTER IMPLEMENTATION PROMPT

Copy the following prompt into the coding/implementation agent.

---

## MASTER PROMPT — Deni Sawa 9.5 UI/UX Upgrade

You are working on the existing **Deni Sawa Partners** website.

Your mission is to improve the existing website toward a **9.5/10 premium UI/UX experience**.

You are NOT starting a new project.

You are NOT redesigning blindly.

You must first understand the existing system.

### PHASE 1 — LEARN THE SYSTEM

Before proposing any changes, inspect the entire existing application.

You must understand:

1. Project structure
2. Framework and versions
3. Routing
4. Layout architecture
5. Components
6. Design system
7. Tailwind/configuration
8. Global CSS
9. Typography
10. Colour tokens
11. Buttons
12. Cards
13. Navigation
14. Footer
15. Responsive breakpoints
16. Animation system
17. Health Check architecture
18. Health Check database interaction
19. Health Check question models
20. Health Check submission flow
21. AI/report generation flow
22. Report storage
23. PDF generation
24. Word generation
25. Email/private report-link flow
26. Business Health Score implementation
27. Deni Sawa Assistant
28. Image assets
29. Health Check images
30. API routes/server actions
31. Authentication if present
32. Database schema relevant to the website
33. Environment variables
34. Third-party services
35. SEO metadata
36. Performance-sensitive components
37. Existing mobile behaviour

Do not modify anything during this discovery phase unless required to safely inspect the system.

Create an internal map of the application.

### CRITICAL EXISTING FEATURES

The Business Health Score is intentionally dynamic.

It moves randomly up/down and changes between:

- Fragile
- Stable
- Resilient

Preserve this behaviour.

Do not convert it into a real calculated score.

The Health Checks already exist and are database-backed.

Do not recreate them.

Do not replace their database logic.

Do not invent alternative forms.

The Health Checks already have dedicated images.

Inspect and preserve those assets.

Animations already exist.

Do not treat "add animations" as an implementation task.

Inspect the existing animation system and recommend refinement only where justified.

---

# PHASE 2 — AUDIT

After learning the system, audit it against the following dimensions:

### Visual

- typography
- spacing
- hierarchy
- colour
- composition
- cards
- imagery
- buttons
- borders
- shadows
- visual density

### UX

- navigation
- user routing
- CTA hierarchy
- Health Check discovery
- conversion flow
- information architecture
- cognitive load
- interaction clarity

### Motion

- animation quality
- timing
- easing
- consistency
- accessibility
- performance

### Responsive

- desktop
- tablet
- mobile
- navigation
- cards
- typography
- touch targets
- CTA visibility

### Accessibility

- contrast
- keyboard
- semantics
- focus
- reduced motion
- screen readers

### Performance

- images
- fonts
- JavaScript
- client components
- hydration
- network calls
- animations
- page load

### Product UX

- Health Check flow
- report flow
- AI Assistant
- recommended pathways
- conversion journey

---

# PHASE 3 — IDENTIFY GAPS

Compare the actual implementation against the 9.5 target.

Classify every recommendation as:

### P0
Critical to the 9.5 experience.

### P1
High-value refinement.

### P2
Nice-to-have enhancement.

### P3
Future/experimental.

For every proposed change provide:

- current behaviour
- problem
- proposed improvement
- user benefit
- implementation complexity
- risk
- affected files/components
- dependencies
- whether backend/database changes are required

Do not propose a change merely because it sounds impressive.

---

# PHASE 4 — CREATE A PLAN

Produce a structured implementation plan.

The plan must contain:

1. Executive summary
2. Current system understanding
3. Current strengths
4. UX problems
5. Visual problems
6. Conversion problems
7. Mobile problems
8. Accessibility problems
9. Performance problems
10. Health Check observations
11. Business Health Score observations
12. Animation observations
13. AI Assistant observations
14. Prioritised recommendations
15. Proposed implementation phases
16. Risk assessment
17. Files/components likely affected
18. Database/API impact
19. Testing strategy
20. Rollback considerations

Do not implement anything yet.

---

# PHASE 5 — STOP AND ASK THE USER

This is mandatory.

After producing the plan, STOP.

Do not modify code.

Ask the user which recommendations they want to implement.

Present the choices in a clear selection format.

Example:

### P0 — Core UX

1. Health Check journey refinement
2. Hero refinement
3. User-routing refinement
4. Recovery → Best-in-Class visual journey

### P1 — Premium refinement

5. Reduce/restructure card density
6. Deni Sawa Method™ interactive refinement
7. Who We Serve refinement
8. Proof/case-study section
9. SpecialSit Network refinement
10. Blog/Intelligence refinement
11. AI Assistant journey refinement

### P2 — Technical polish

12. Motion refinement
13. Mobile refinement
14. Accessibility refinement
15. Performance refinement
16. Design-system consistency pass

Then ask:

> **Which items would you like me to implement? You can choose individual numbers, entire groups, or say "all P0".**

Do NOT assume the user wants everything.

Do NOT implement anything before the user chooses.

---

# PHASE 6 — AFTER USER CHOICE

Only after the user explicitly selects items:

1. Reconfirm the selected scope.
2. Inspect the exact files involved.
3. Create a detailed implementation sequence.
4. Implement incrementally.
5. Preserve existing functionality.
6. Test each affected flow.
7. Check desktop.
8. Check mobile.
9. Check accessibility.
10. Check performance.
11. Check Health Check functionality.
12. Check Business Health Score random behaviour.
13. Check existing animations.
14. Check AI Assistant.
15. Report exactly what changed.

---

# QUALITY BAR

Before considering the work complete, ask:

> Does this feel like a premium advisory institution?

> Does the visitor understand where to start?

> Is the Health Check journey obvious?

> Is the design distinctive without being flashy?

> Are the existing systems preserved?

> Does the site feel calmer and more intentional?

> Is every animation justified?

> Is every card necessary?

> Is every CTA intentional?

> Does mobile feel designed rather than merely responsive?

> Has any unsupported claim or fake data been introduced?

If any answer is no, continue refining or report the remaining issue.

---

# FINAL PRINCIPLE

Do not optimise for "more UI".

Optimise for:

**Clarity → Confidence → Diagnosis → Direction → Action → Transformation**

The website should make the visitor feel:

> **"Deni Sawa understands my situation, can help me diagnose it, and knows what the next step should be."**

That is the standard required for a 9.5/10 experience.

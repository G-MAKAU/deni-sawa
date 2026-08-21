HEALTH CHECK REPORT COMPARISON — CONTENT & UI UPGRADE PROMPT

You are working on the existing Deni Sawa Partners Next.js 14 codebase. The current "What You Get" section on the Health Checks page has a basic feature comparison table. Replace it entirely with the upgraded version specified below. Surgical edit only — do not rebuild the page.

CURRENT IMPLEMENTATION TO REPLACE

Find and replace the entire "What You Get" section — the section containing the heading "What you get", the subtitle "Start with the free summary. Unlock the full diagnostic." and the feature comparison table. Replace everything between the section opening and closing tags with the new implementation below.

NEW SECTION HEADING & INTRO

Section label (small caps, green): Your Report

H2: Two reports. One assessment.

Subheading (body, muted):

Every completed assessment generates two reports. The Summary is yours immediately, free. The Full Diagnostic is a one-off upgrade — written for decision-making, not just awareness.

NEW TWO-COLUMN REPORT CARDS

Replace the table entirely with two side-by-side cards. On mobile they stack vertically. The Full Diagnostic card is visually dominant — larger, more detailed, with an orange accent.

CARD 1 — FREE SUMMARY REPORT

Card style:

White background
1px border 
#E0E0E0
8px radius
No top accent bar
"Free" badge: green pill top-right corner — "Free · Instant"

Header:

Summary Report
Yours immediately after completing the assessment.
No payment. No waiting.

What's included — written as benefit statements, not feature labels:

✓  Your overall health score with a plain-language verdict
   A single score out of 100 with a clear rating: 
   Fragile · Developing · Stable · Resilient · Best-in-Class

✓  Executive summary
   A concise overview of your current position — 
   what the assessment found across all sections in plain language.

✓  Your top 3 priority areas
   The three areas requiring your most urgent attention, 
   clearly flagged and briefly explained.

✓  Delivered privately
   Sent to your email or WhatsApp immediately with a 
   private link. Not stored publicly. Not shared.

✓  PDF download
   Download and keep your summary report as a PDF.

What's not included (honest, not salesy):

The summary does not include section-by-section findings, 
the full recommendation list, or the Word export. 
Those are in the Full Diagnostic.

CTA button: Green outline — "Start Your Free Assessment →"

CARD 2 — FULL DIAGNOSTIC REPORT

Card style:

White background
2px border 
#E8510A (orange)
8px radius
Top accent bar: solid orange 
#E8510A, 4px height
"Recommended" badge: orange pill top-right — "Full Diagnostic · One-off"
Subtle orange box shadow: 0 4px 24px rgba(232, 81, 10, 0.10)

Header:

Full Diagnostic Report
The complete picture. Built for action.
One-off unlock. No subscription.

What's included — written as benefit statements:

✓  Everything in the Summary Report
   Your score, executive summary, and top 3 priorities — 
   included in full.

✓  Section-by-section findings
   A detailed breakdown of every assessment category — 
   Financial Health, Operations, Governance, Cashflow, 
   Growth Readiness (Business) or Personal Finances, Debt, 
   Cashflow, Savings, Resilience (Professional).
   Each section: what we found, what it means, 
   and how serious it is.

✓  Prioritised recommendation list
   A structured list of recommended actions, ordered by 
   urgency and impact. Not generic advice — specific to 
   your responses. Written so you can act on them 
   the same day.

✓  Root cause analysis
   For each priority area: what is driving the issue, 
   not just what the issue is. Understanding the root 
   cause is the difference between treating symptoms 
   and solving problems.

✓  Benchmarking context
   Where your scores sit relative to what Deni Sawa 
   advisors typically see across similar businesses 
   or professionals. Context that makes the findings 
   meaningful.

✓  90-day focus plan
   Three to five specific actions to focus on in the 
   next 90 days, drawn from your recommendation list 
   and prioritised by our advisors.

✓  PDF & Word export
   Download in both formats. Share with your board, 
   your banker, your accountant, or your mentor.

✓  Delivered privately
   Sent to your email or WhatsApp with a private link. 
   Also accessible in your secure report page anytime.

✓  Foundation for your Clarity Call
   The Full Diagnostic is what our advisors read before 
   your Clarity Call. It means your first conversation 
   is already informed — no time wasted on basics.

Pricing line (below the features list):

One-off report upgrade
KES [price] · or USD [price]
No subscription. No recurring charge. Pay once, keep forever.

Note: Leave price as a placeholder constant REPORT_PRICE_KES and REPORT_PRICE_USD defined in /lib/constants.ts so it can be updated without touching the component.

CTA button: Orange solid — "Unlock the Full Diagnostic →"

Below CTA (small muted text):

Secure payment. Your summary report must be completed first. Upgrade available immediately after your free summary is delivered.

UPDATED COMPARISON TABLE

Keep a comparison table below the two cards — but rewrite every row to be meaningful, not just checkmarks.

Table heading: At a glance

	Summary	Full Diagnostic
Overall health score	✓ Score + rating	✓ Score + rating
Executive summary	✓ Concise overview	✓ Full narrative
Top 3 priorities	✓ Flagged + brief note	✓ With root cause analysis
Section-by-section findings	—	✓ Every category in detail
Prioritised recommendation list	—	✓ Ordered by urgency + impact
Root cause analysis	—	✓ Per priority area
Benchmarking context	—	✓ Vs advisory team benchmarks
90-day focus plan	—	✓ 3–5 specific actions
PDF export	✓	✓
Word (.docx) export	—	✓
Private link delivery	✓ Email or WhatsApp	✓ Email or WhatsApp
Foundation for Clarity Call	Partial	✓ Full advisor briefing
Price	Free	KES [price]

Table design:

White background, 1px 
#E0E0E0 border, 8px radius
Header row: dark charcoal 
#2C2C2C background, white text
Summary column header: green 
#5A9E28
Full Diagnostic column header: orange 
#E8510A
✓ in orange for Full Diagnostic column, green for Summary column
— in muted grey 
#999999
Alternating row backgrounds: white / 
#F9F7F5
Price row: bold, orange text for Full Diagnostic price
On mobile: horizontally scrollable, min-width 580px
TRUST STRIP BELOW THE TABLE

Add a row of four trust signals directly below the comparison table:

🔒 Private & Confidential    ⚡ Generated Instantly    📋 Advisor-Reviewed Framework    💳 One-off · No Subscription

Design:

Four equal columns, centred
Icon in orange, label in dark text, 13px
Thin 
#E0E0E0 dividers between items
Off-white 
#F9F7F5 background strip, 16px padding top and bottom
On mobile: 2×2 grid
WHAT CHANGES IN THE DB & REPORT GENERATION

The Full Diagnostic now includes two new report elements that must be generated by Claude and stored:

Add to the detailed Claude system prompt (update in health_check_report_prompts table):

After the Recommendations section, add two additional sections:

1. An H2 section titled "Root Cause Analysis" — for each of the top 3 priority areas, write a HeadingNode H3 with the priority name, then a ParagraphNode explaining the underlying driver of the issue, not just the symptom. Be specific to the user's responses.

2. An H2 section titled "Your 90-Day Focus Plan" — write a ListNode (numbered) containing 3 to 5 specific actions the user should focus on in the next 90 days. Each item should be concrete and directly drawn from the recommendation list above. Frame each as an action starting with a verb: "Review...", "Implement...", "Schedule...", "Reduce...", "Engage...".

Also add a benchmarking context paragraph under each H2 section heading: one sentence noting where this area typically sits for similar businesses or professionals based on common advisory experience. Frame it as: "Across similar assessments, we typically see..." — do not use specific percentages unless the user's data supports it.

Add report_tier to the Lexical report display component:

Summary report: render with green accent colours, "Summary Report" label
Detailed report: render with orange accent colours, "Full Diagnostic" label
Add a coloured badge at the top of the report viewer: green "Summary" or orange "Full Diagnostic"
UPGRADE FLOW

When a user clicks "Unlock the Full Diagnostic →":

User clicks upgrade CTA
  → Modal appears (do not navigate away from report page)
  
Modal content:
  Heading: "Unlock Your Full Diagnostic"
  Subheading: "One-off payment. Immediate access."
  Price: KES [REPORT_PRICE_KES]
  
  Summary of what they unlock:
  · Section-by-section findings
  · Prioritised recommendation list  
  · Root cause analysis
  · Benchmarking context
  · 90-day focus plan
  · Word export
  
  Payment button: "Pay & Unlock →" (orange, full width)
  Below: "Secure payment · No subscription · Keep forever"
  Cancel: text link "Maybe later"

On successful payment:
  → report.is_paid = true (update in DB)
  → Trigger delivery of full report via preferred channel
  → Report page upgrades in place — no page reload
  → Show success state: "Your Full Diagnostic is ready." 
     with green checkmark animation
  → Export buttons (PDF + Word) become active

Note: Leave payment integration as a placeholder function handleReportUpgrade(reportId: string) in /lib/payments.ts — commented with:

typescript
// TODO: Integrate payment provider here
// On success: call PATCH /api/health-check/reports/[reportId]/unlock
// This endpoint sets is_paid = true and triggers full report delivery

Add the API route:

PATCH /api/health-check/reports/[reportId]/unlock
  - Verify reportId exists
  - Set is_paid = true
  - Trigger POST /api/internal/deliver-report/email or whatsapp
    based on session.preferred_delivery
  - Return: { success: true, reportType: 'detailed' }
OUTPUT ORDER
Update health_check_report_prompts seed / SQL — add root cause analysis and 90-day plan instructions to the detailed prompt for both health checks
/health-checks page — replace "What You Get" section with new two-card layout + table + trust strip
Report viewer component — add report tier badge (Summary green / Full Diagnostic orange)
/lib/constants.ts — add REPORT_PRICE_KES and REPORT_PRICE_USD constants
Upgrade modal component
/lib/payments.ts — placeholder handleReportUpgrade function
PATCH /api/health-check/reports/[reportId]/unlock API route

Do not rebuild the Health Checks page. Replace only the What You Get section and add the upgrade modal as a new component. Every word of the card content above must be written out in full — no placeholders in the UI copy.
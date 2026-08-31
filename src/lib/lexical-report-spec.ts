/**
 * Lexical "design system" specification for report generation.
 *
 * This is a machine-authored appendix that is appended to the STORED system
 * prompt at generation time (never edited by admins). It teaches the model the
 * exact Lexical node schema and the premium report design language so the
 * generated EditorState JSON renders cleanly through LexicalRenderer +
 * `.report-doc` styling.
 *
 * It must stay in sync with the whitelist in `sanitizeNode` (report-generator.ts)
 * and the brand theme (LexicalTheme.ts + index.css .report-doc rules).
 */
export const LEXICAL_DESIGN_SPEC = `

# REPORT DESIGN SYSTEM (Lexical EditorState)

You are producing a Lexical EditorState JSON object. Follow this schema and
design language exactly so the report renders as a premium, well-aligned
document. Fields you may omit (direction, indent, version, mode, style, detail,
format-on-block) are filled in automatically — but always include the fields
shown below.

OVERRIDE: If the base prompt tells you to avoid tables, IGNORE it — the report
renderer fully supports tables, checklists and background colours now. Use them.

## 1. Node types and their required fields

- root — top-level container: {"type":"root","children":[...]}
- heading — {"type":"heading","tag":"h1"|"h2"|"h3","children":[text]}
- paragraph — {"type":"paragraph","children":[...]}
- quote — {"type":"quote","children":[...]}
- list — {"type":"list","listType":"bullet"|"number"|"check","children":[listitem]}
- listitem — {"type":"listitem","value":1,"checked":true|false,"children":[...]}
- text — {"type":"text","text":"...","format":<bitmask>,"style":"..."}
- callout — {"type":"callout","tone":"brand"|"growth"|"dark","children":[paragraph]}
- stickynote — {"type":"stickynote","color":"yellow"|"green"|"blue","children":[paragraph]}  (a hand-written note for a key reminder or client takeaway)
- divider — {"type":"divider"}  (use between major sections)
- pagebreak — {"type":"pagebreak"}  (use between major sections when a hard page boundary is wanted in exports)
- link — {"type":"link","url":"https://...","text":"label","format":0}
- image — {"type":"image","src":"https://...","alt":"...","width":<px|null>,"layout":"center"|"square-left"|"square-right"|"inline"}
- table — {"type":"table","children":[tablerow]}
- tablerow — {"type":"tablerow","children":[tablecell]}
- tablecell — {"type":"tablecell","headerState":0|2,"children":[paragraph]}

Every table cell must contain a block node (a paragraph), never bare text.
Set "headerState": 2 on the cells of the header row (renders a tinted, bold
<th>), and "headerState": 0 on body cells.

## 2. Text formatting (the "format" bitmask on text nodes)

Use a NUMBER, the sum of the flags you want:
- 1 = bold (use for key figures, ratings, dollar amounts, verdicts)
- 2 = italic
- 4 = underline
- 8 = strikethrough
- 16 = inline code
Combine by summing (e.g. 3 = bold+italic, 5 = bold+underline). 0 = plain text.

## 2b. Inline styling (the "style" string on text nodes)

Set a CSS string on a text node for refined typography and colour. Use a
semicolon-separated list; only these properties render: color, background-color,
font-size, font-family, font-weight, font-style, text-decoration, line-height,
letter-spacing. Do NOT use url()/expressions.

- Colour a verdict, rating or headline figure:
  {"type":"text","text":"Healthy","format":1,"style":"color: #5A9E28"}
  {"type":"text","text":"At risk","format":1,"style":"color: #E8510A"}
- Highlight an inline callout (background tint behind the text):
  {"type":"text","text":"Priority","format":1,"style":"background-color: #FDF3EC; color: #E8510A"}
- Enlarge a headline metric within a paragraph:
  {"type":"text","text":"1.2x","format":1,"style":"font-size: 20px; color: #E8510A"}
- Restrained, premium palette (stick to these):
  - Brand orange #E8510A / #C44508, tint #FDF3EC
  - Growth green #5A9E28 / #48801F, tint #F4F9EE
  - Ink #1A1A1A, muted #666666, light surface #F9F7F5
  - White #FFFFFF (only on a dark background)
  Font families: Inter, Georgia (serif display), "JetBrains Mono". Font sizes 12–28px.

## 2c. Block styling (the "style" string on paragraph/heading/tablecell nodes)

Use block "style" with background-color to build elegant, highlighted panels.
The editor auto-adds padding (0.75rem 1rem) and border-radius (6px) when you
set background-color via the toolbar, so you only need to specify the colour
in the style string — the padding and rounding are applied automatically.
The renderer paints background-color, text-align, color, font-size, padding and
border-radius on paragraph/heading blocks. Make the report feel designed:
- The Overall Score / interpretation box MUST be a highlighted panel:
  {"type":"paragraph","style":"background-color: #FDF3EC;","children":[...]}
- Highlight each dimension score line with a subtle tint.
- Use "text-align: center" for the cover block and closing call-to-action.
- Tint table header cells via a block style inside the header cell:
  {"type":"paragraph","style":"background-color: #FDF3EC; color: #E8510A;","children":[{"type":"text","text":"Metric","format":1}]}
Use one highlight per section maximum so the page stays clean, not cluttered.

### Background filler cheat-sheet (for the AI generating JSON)

| What             | style string                                          |
|------------------|-------------------------------------------------------|
| Highlighted panel | "background-color: #FDF3EC"                          |
| Orange accent panel | "background-color: #FEF0E5"                        |
| Green accent panel | "background-color: #F4F9EE"                         |
| Tinted header cell | "background-color: #FDF3EC; color: #E8510A"         |
| Clear a block    | "background-color: null" (removes fill, padding, rounding) |

The toolbar automatically adds padding: 0.75rem 1rem and border-radius: 6px
when a background colour is set. When clearing, it strips those too.
Do NOT manually add padding or border-radius to a background-color style — the
editor handles it. You only set the colour.

## 3. Callout tones

- "brand" → top-priority recommendation or "why it matters" (renders a
  "Priority" labelled panel with an orange accent).
- "growth" → positive finding or quick win (renders a "Note" panel, green accent).
- "dark" → neutral / cautionary note (renders a muted "Note" panel).

## 3b. Images (use only from this palette)

You may insert a tasteful image to anchor a section. ONLY use these exact URLs
(layout "center" or "square-right" with width 240–320px is usually best):

- https://www.denisawa.co.ke/images/growth.jpg — Growth & business development
- https://www.denisawa.co.ke/images/recovery.jpg — Recovery & restructuring
- https://www.denisawa.co.ke/images/leadership.jpg — Leadership & strategy
- https://www.denisawa.co.ke/images/governance.jpg — Governance & controls
- https://www.denisawa.co.ke/images/exec-finance.jpg — Finance & cashflow
- https://www.denisawa.co.ke/images/strategy.jpg — Strategic planning

Example:
{"type":"image","src":"https://www.denisawa.co.ke/images/growth.jpg","alt":"Growth path","width":280,"layout":"center"}

Never invent an image URL. At most one image per section, and omit images if
they do not genuinely add value to the finding.

## 4. Design language (make it premium and scannable)

- H1: the report title (renders as a large serif headline).
- H2: each major section — uppercase orange headings with a divider underline.
- H3: sub-findings within a section.
- Never skip heading levels; do not use H4–H6.
- Open with H1 title, then a short paragraph ("Prepared for …"), then a divider.
- Bold the single most important number or term in each finding.
- Use bullet lists for findings, numbered lists for ordered steps/priorities.
- Use a CHECK list ("listType":"check", each item "checked":false) for the
  action checklist in the recommendations and roadmap — this is required.
  Set "checked":true for items that are already done or confirmed by the
  respondent's answers. Set "checked":false for items that are recommended
  but not yet done. This gives the reader a visual progress indicator.
- Use a TABLE for structured data: the client snapshot, the six-dimension score
  table, risk tables and milestone tables. Tables are strongly preferred over
  run-on bullet lists for anything tabular.
- Use a callout for the single top-priority recommendation per section.
- Use a sticky note ("type":"stickynote") sparingly, for ONE high-visibility
  client takeaway or a short "remember this" note — never more than 2–10 per
  report, and keep its text to 1–2 short sentences. Pick "yellow" by default;
  use "green"/"blue" only when it matches the section theme.
- Use a quote for advisor notes / direct recommendations.
- Put a divider between every major section for clean separation.
- Use a page break ("type":"pagebreak") only between major sections when the
  following section should start on its own page in exports (e.g. before the
  recommendations or the action roadmap). Use sparingly — never mid-section.
- Keep paragraphs short (2–3 sentences). Prefer scannable structure over prose.

## 4b. A4 page layout and pagination rules (CRITICAL for exports)

This report is designed for **A4 paper (210 × 297 mm / 8.27 × 11.69 in)**.
PDF and Word exports use A4. Design your content to fit cleanly on A4 pages.

**Content budget per A4 page:**
- After header/footer margins, usable height ≈ 240 mm (≈ 680 pt).
- A heading + paragraph block uses ≈ 20–30 mm.
- A bullet/check list with 5 items uses ≈ 30–40 mm.
- A 2-column, 5-row table uses ≈ 50–60 mm.
- A callout panel uses ≈ 25–35 mm.
- An H1 cover block + score panel uses ≈ 60–80 mm.

Rule of thumb: **one major H2 section with 2–3 findings, a table, and a
callout typically fills one A4 page.** Plan your section lengths accordingly.

**Page break placement (to avoid content cut-off):**
- Insert a page break **before** a new H2 section — never in the middle of a
  list, table, or callout. A table or callout that straddles a page boundary
  will be split awkwardly in PDF/Word.
- If a section is long (> 2 pages), split it at a natural paragraph boundary
  with a page break before the next H3 or finding block.
- Never place a page break immediately after an H2 heading (the heading would
  sit alone at the bottom of a page with content on the next page — an orphan).
- After a page break, the first element should be an H2 heading or a short
  intro paragraph, so the page opens with context.
- The closing call-to-action and confidentiality notice should share the same
  final page — do not page-break between them.

**Alignment and export fidelity:**
- Tables render in full width. Keep cell text concise (≤ 40 words per cell)
  so columns align without overflow.
- Callout panels have auto padding. Avoid nesting tables inside callouts.
- Background-coloured blocks (highlight panels) auto-add padding and rounding
  in the editor — do not add manual padding via the style string.
- Images with "layout": "center" are full-width. With "square-left" or
  "square-right" they float beside text. Set width 240–320 px.
- Stick to the brand palette (section 2b). Off-palette colours render in
  the editor but may be lost or shifted in PDF colour conversion.

## 5. Hard rules

- Return ONLY the JSON object — no prose, no markdown fences, no comments.
- Every key and string value must be double-quoted; no trailing commas.
- Ensure the root has at least one non-empty text node (never an empty report).

## 6. Few-shot example (exact structure)

{
  "root": {
    "type": "root",
    "children": [
      {
        "type": "heading",
        "tag": "h1",
        "children": [
          { "type": "text", "text": "Business Health Report", "format": 0 }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          { "type": "text", "text": "Prepared for ", "format": 0 },
          { "type": "text", "text": "Jane Wanjiru", "format": 1 }
        ]
      },
      { "type": "divider" },
      {
        "type": "paragraph",
        "style": "background-color: #FDF3EC; text-align: center;",
        "children": [
          { "type": "text", "text": "Overall Health Score ", "format": 0 },
          { "type": "text", "text": "6.8 / 10", "format": 1, "style": "font-size: 22px; color: #E8510A" }
        ]
      },
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          { "type": "text", "text": "Cashflow Position", "format": 0 }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          { "type": "text", "text": "Current ratio is ", "format": 0 },
          { "type": "text", "text": "1.2x", "format": 1 },
          { "type": "text", "text": ", indicating tight but manageable liquidity.", "format": 0 }
        ]
      },
      {
        "type": "list",
        "listType": "bullet",
        "children": [
          {
            "type": "listitem",
            "value": 1,
            "children": [
              { "type": "text", "text": "Receivables days up 22% quarter-on-quarter", "format": 0 }
            ]
          },
          {
            "type": "listitem",
            "value": 2,
            "children": [
              { "type": "text", "text": "Payables cycle shortened by one week", "format": 0 }
            ]
          }
        ]
      },
      {
        "type": "callout",
        "tone": "brand",
        "children": [
          {
            "type": "paragraph",
            "children": [
              { "type": "text", "text": "Negotiate longer payment terms with your two largest suppliers within 30 days.", "format": 0 }
            ]
          }
        ]
      },
      {
        "type": "table",
        "children": [
          {
            "type": "tablerow",
            "children": [
              {
                "type": "tablecell",
                "headerState": 2,
                "children": [
                  {
                    "type": "paragraph",
                    "style": "background-color: #FDF3EC; color: #E8510A;",
                    "children": [
                      { "type": "text", "text": "Dimension", "format": 1 }
                    ]
                  }
                ]
              },
              {
                "type": "tablecell",
                "headerState": 2,
                "children": [
                  {
                    "type": "paragraph",
                    "style": "background-color: #FDF3EC; color: #E8510A;",
                    "children": [
                      { "type": "text", "text": "Score", "format": 1 }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "type": "tablerow",
            "children": [
              {
                "type": "tablecell",
                "headerState": 0,
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      { "type": "text", "text": "Financial Health & Cash Flow", "format": 0 }
                    ]
                  }
                ]
              },
              {
                "type": "tablecell",
                "headerState": 0,
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      { "type": "text", "text": "5.4 / 10", "format": 1 }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "type": "list",
        "listType": "check",
        "children": [
          {
            "type": "listitem",
            "value": 1,
            "checked": true,
            "children": [
              { "type": "text", "text": "Separate business bank account (already in place)", "format": 0 }
            ]
          },
          {
            "type": "listitem",
            "value": 2,
            "checked": false,
            "children": [
              { "type": "text", "text": "Build a 13-week cashflow forecast", "format": 0 }
            ]
          }
        ]
      }
    ]
  }
}
`;

/** Append the design spec to a stored system prompt without modifying the prompt. */
export function withLexicalDesignSpec(systemPrompt: string): string {
  return `${systemPrompt}\n${LEXICAL_DESIGN_SPEC}`;
}

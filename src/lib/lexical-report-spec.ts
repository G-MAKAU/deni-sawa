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
- divider — {"type":"divider"}  (use between major sections)
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
The renderer paints background-color, text-align, color, font-size, padding and
border-radius on paragraph/heading blocks. Make the report feel designed:
- The Overall Score / interpretation box MUST be a highlighted panel:
  {"type":"paragraph","style":"background-color: #FDF3EC; padding: 0.9rem 1rem; border-radius: 8px;","children":[...]}
- Highlight each dimension score line with a subtle tint.
- Use "text-align: center" for the cover block and closing call-to-action.
- Tint table header cells via a block style inside the header cell:
  {"type":"paragraph","style":"background-color: #FDF3EC; color: #E8510A;","children":[{"type":"text","text":"Metric","format":1}]}
Use one highlight per section maximum so the page stays clean, not cluttered.

## 3. Callout tones

- "brand" → top-priority recommendation or "why it matters" (renders a
  "Priority" labelled panel with an orange accent).
- "growth" → positive finding or quick win (renders a "Note" panel, green accent).
- "dark" → neutral / cautionary note (renders a muted "Note" panel).

## 3b. Images (use only from this palette)

You may insert a tasteful image to anchor a section. ONLY use these exact URLs
(layout "center" or "square-right" with width 240–320px is usually best):

- https://deni-sawa.vercel.app/images/growth.jpg — Growth & business development
- https://deni-sawa.vercel.app/images/recovery.jpg — Recovery & restructuring
- https://deni-sawa.vercel.app/images/leadership.jpg — Leadership & strategy
- https://deni-sawa.vercel.app/images/governance.jpg — Governance & controls
- https://deni-sawa.vercel.app/images/exec-finance.jpg — Finance & cashflow
- https://deni-sawa.vercel.app/images/strategy.jpg — Strategic planning

Example:
{"type":"image","src":"https://deni-sawa.vercel.app/images/growth.jpg","alt":"Growth path","width":280,"layout":"center"}

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
- Use a TABLE for structured data: the client snapshot, the six-dimension score
  table, risk tables and milestone tables. Tables are strongly preferred over
  run-on bullet lists for anything tabular.
- Use a callout for the single top-priority recommendation per section.
- Use a quote for advisor notes / direct recommendations.
- Put a divider between every major section for clean separation.
- Keep paragraphs short (2–3 sentences). Prefer scannable structure over prose.

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
                    "children": [
                      { "type": "text", "text": "Dimension", "format": 1, "style": "color: #E8510A" }
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
                    "children": [
                      { "type": "text", "text": "Score", "format": 1, "style": "color: #E8510A" }
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
            "checked": false,
            "children": [
              { "type": "text", "text": "Open a separate business bank account this week", "format": 0 }
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

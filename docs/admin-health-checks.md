# Admin Guide: Health Check Question Management

## Importing Questions from Google Forms

Admins can bulk-import questions into any health check using the **Import** feature. This supports two formats: structured JSON and plain text.

### How to Import

1. Navigate to **Admin → Health Checks → Questions**
2. Click the **Import** button in the top-right actions bar
3. Choose your format tab (JSON or Plain Text)
4. Paste your content into the textarea
5. Click **Preview import** to review the parsed structure
6. Verify sections, subsections, questions, and options look correct
7. Click **Import** to commit

### JSON Format

Use this when you have structured data (e.g., from a browser extension like "Forms to JSON").

```json
{
  "sections": [
    {
      "title": "Section A: Cash Flow",
      "description": "Optional section description",
      "subsections": [
        {
          "heading": "Cash Flow Management",
          "description": "Optional subsection description",
          "questions": [
            {
              "text": "How do you manage your monthly cash flow?",
              "type": "paragraph",
              "required": true,
              "helper_text": "Optional guidance text"
            },
            {
              "text": "What is your primary revenue source?",
              "type": "single_select",
              "required": true,
              "options": ["Product sales", "Services", "Subscription", "Other"]
            },
            {
              "text": "Which financial tools do you use?",
              "type": "multi_select",
              "required": false,
              "options": ["QuickBooks", "Xero", "Spreadsheet", "None"]
            }
          ]
        }
      ]
    }
  ]
}
```

**Field reference:**

| Field | Required | Default | Notes |
|---|---|---|---|
| `sections[].title` | Yes | — | Section heading (max 200 chars) |
| `sections[].description` | No | null | Optional section description |
| `sections[].subsections[]` | Yes | — | At least one subsection per section |
| `subsections[].heading` | Yes | — | Subsection heading (max 200 chars) |
| `subsections[].questions[]` | Yes | — | At least one question per subsection |
| `questions[].text` | Yes | — | The question text (max 2000 chars) |
| `questions[].type` | No | `paragraph` | `paragraph`, `single_select`, or `multi_select` |
| `questions[].required` | No | `true` | Whether the question is mandatory |
| `questions[].helper_text` | No | null | Optional guidance shown under the question |
| `questions[].options` | No | `[]` | Array of strings — required for select types |

### Plain Text Format

Use this when copying questions directly from Google Forms edit mode.

**Formatting rules:**

| Syntax | Meaning |
|---|---|
| `## Section Title` | Creates a new section |
| `### Subsection Title` | Creates a new subsection |
| `[radio] Question text` | Creates a single-select question |
| `[checkbox] Question text` | Creates a multi-select question |
| `[text] Question text` | Creates a paragraph question |
| `- Option text` (indented) | Adds an option to the current select question |
| Plain text (no prefix) | Creates a paragraph question |

**Example:**

```
## Section A: Cash Flow
### Cash Flow Management
How do you manage your monthly cash flow?
[radio] What is your primary revenue source?
- Product sales
- Services
- Subscription
[checkbox] Which expenses do you track monthly?
- Rent
- Salaries
- Marketing
- Software subscriptions
## Section B: Operations
### Daily Operations
What tools do you use for project management?
```

### Preview Step

After clicking "Preview import", the system shows a tree view of what will be created:

- **Section count** — how many sections will be added
- **Question count** — total questions across all sections
- **Option count** — total answer options for select questions
- **Expandable tree** — click sections and subsections to see individual questions with their types and options

You can go back to edit the content before committing the import.

### What Happens on Import

- Sections are appended after existing sections (sorted by creation order)
- Each section gets one subsection per entry in the `subsections` array
- Questions are added to their respective subsections
- Options are created for `single_select` and `multi_select` questions
- All foreign keys cascade — deleting a section removes its subsections, questions, and options

### Tips for Google Forms

1. **Open your Google Form in edit mode** (not preview)
2. **Copy all questions** — you can use a browser extension like "Forms to JSON" for structured export, or manually copy the text
3. **For JSON export**, install a browser extension that exports Google Forms as JSON, then paste the output directly
4. **For text paste**, copy the question titles and use `[radio]` / `[checkbox]` prefixes to set question types
5. **Options** are the choice texts — copy them as `- Option text` lines under select questions

### After Importing

- Review questions in the Questions Manager — click each subsection to see its questions
- Reorder questions using the arrow buttons
- Edit any question to adjust text, type, options, or required status
- The imported questions are immediately available to users taking the health check

---

## Other Admin Tasks

### Creating a Health Check

1. Go to **Admin → Health Checks**
2. Click **Create health check**
3. Fill in name, slug, description, estimated time, and pricing
4. The check is created with empty sections — use Import or add sections manually

### Managing Sections

- **Sections Manager** (`/admin/health-checks/[id]/sections`) — drag to reorder, inline edit titles
- Each section should represent a major topic area (e.g., "Cash Flow", "Operations")
- Sections display in the health check form in `sort_order` order

### Managing Questions

- **Questions Manager** (`/admin/health-checks/[id]/questions`) — two-panel layout
- Left panel: section → subsection tree
- Right panel: questions for the selected subsection
- Click **Add question** for single-question creation
- Click **Import** for bulk import from Google Forms

### Question Types

| Type | Answer Format | Use Case |
|---|---|---|
| `paragraph` | Free text (textarea) | Open-ended questions, descriptions |
| `single_select` | Radio buttons (pick one) | Multiple choice with one answer |
| `multi_select` | Checkboxes (pick many) | Multiple choice with multiple answers |

### Exporting Questions

- Go to **Admin → Health Checks → [Your Check] → Export**
- Choose PDF or Word format
- The full question bank is exported with sections, subsections, and all questions

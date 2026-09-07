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

---

## Managing Reports

### Reports Viewer

Navigate to **Admin → Health Checks → Reports** to see all generated reports.

Each report row shows:

| Column | Description |
|---|---|
| **Type** | Summary or Detailed |
| **Client** | Client name from the session |
| **Health Check** | Which health check this belongs to |
| **Paid** | Toggle — whether the report has been paid for |
| **Public** | Toggle — whether the report is publicly accessible via its token link |
| **Delivery** | pending / sent / failed / skipped |
| **Gen Status** | Whether AI generation succeeded or had errors |
| **Created** | When the report was generated |
| **Expires** | When the report link expires (summaries = 30 days, detailed = 12 months) |

### Revoking / Re-enabling Public Access

Every report has a **Public** toggle in the Reports table.

- **ON (green)** — the report is accessible to anyone with the token link
- **OFF (grey)** — public access is revoked; anyone visiting the link sees a "revoked" message

To revoke or re-enable:
1. Go to **Admin → Health Checks → Reports**
2. Find the report in the table
3. Click the **Public** toggle to switch it off (revoke) or on (re-enable)

**What happens when revoked:**
- The public endpoint (`/api/health-check/report/[token]`) returns HTTP 403 with `"error": "revoked"`
- The user sees: "Public access to this report has been revoked. Please contact the report owner."
- Admin access via the admin panel is unaffected — admins can still view and edit the report
- Re-enabling restores full public access immediately

**Note:** This is separate from report expiry. A report can be expired (past `expires_at`) AND have public access revoked — both must be cleared for the link to work.

### Editing Report Expiry

Each report has an inline **Expires** date picker in the table:
- Click the date to set a new expiry
- Click **Never** to clear the expiry (report never expires)
- Summaries default to 30 days; detailed reports default to 12 months

### Regenerating Reports

- Click the **Regenerate** action on any report row
- Choose whether to send the updated report via email
- The report content is re-generated using the same AI model and prompt
- Previous content is overwritten

### Viewing Report Content

- Click the **View** (eye) icon on any report row
- Opens a full-page viewer with the rendered report
- Admins can click **Edit** to open the Lexical editor and make changes
- Changes are saved with `edited_by` and `edited_at` tracking

### Report API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/admin/health-checks/reports` | GET | List reports (paginated, filterable) |
| `/api/admin/health-checks/reports/[id]` | GET | Get report detail |
| `/api/admin/health-checks/reports/[id]` | PUT | Update report (content, expiry, paid, visibility) |
| `/api/admin/health-checks/reports/[id]/regenerate` | POST | Regenerate report content |
| `/api/admin/health-checks/reports/[id]/resend` | POST | Re-send report email |
| `/api/admin/health-checks/reports/[id]/upgrade` | POST | Upgrade summary → detailed |

### PUT Body Options

```json
// Toggle paid status
{ "is_paid": true }

// Toggle public visibility (revoke / re-enable)
{ "is_public": false }

// Update expiry (ISO string or null to clear)
{ "expires_at": "2026-12-31T23:59:59Z" }
{ "expires_at": null }

// Update report content (Lexical editor state)
{ "lexical_state": { "root": { ... } } }
```

---

## Email Configuration

### From Address

All health check emails send from `advisory@denisawa.co.ke` with the display name "Deni Sawa Partners".

| Email type | Source of from address |
|---|---|
| Report delivery (summary/detailed) | `email_templates` table → `from_email` column |
| Session started | `email_templates` table → `from_email` column |
| Follow-up reminders | Hardcoded `advisory@denisawa.co.ke` in `health-check-followups.ts` |
| Payment confirmation | Hardcoded `advisory@denisawa.co.ke` in `payment.ts` |
| Report upgrade confirmation | Hardcoded `advisory@denisawa.co.ke` in `upgrade/route.ts` |
| Admin alerts (generation failure) | Hardcoded `advisory@denisawa.co.ke` in `generate-report.ts` |

### SMTP Profiles

The system supports two SMTP profiles:

**Primary** (Gmail — `smtp.gmail.com:587`):
- Used for all emails by default
- From address: `mgworkset@gmail.com` (Gmail rewrites the From to the authenticated user)

**Secondary** (Domain server — currently disabled):
- Required to send from `@denisawa.co.ke` addresses
- Configure in `.env`:

```
EMAIL2_HOST=mail.teti.ac.ke
EMAIL2_PORT=465
EMAIL2_SECURE=true
EMAIL2_USER=advisory@denisawa.co.ke
EMAIL2_PASS=your-domain-password
EMAIL2_SENDER_DOMAINS=denisawa.co.ke
```

**Important:** Without the secondary profile configured, all emails are sent via Gmail. Gmail may rewrite the From address to `mgworkset@gmail.com` depending on the email client. To ensure `advisory@denisawa.co.ke` appears as the sender, the secondary SMTP profile must be active.

### Updating Email Templates

Templated emails (report delivery, session started) pull their from address from the `email_templates` table. To update:

1. Go to **Admin → Email Templates**
2. Edit the template (e.g., `health_check_report_summary`, `health_check_report_detailed`, `health_check_started`)
3. Set `from_email` to `advisory@denisawa.co.ke`
4. Set `from_name` to `Deni Sawa Partners`

### Email Logging

All sent emails are logged to the `email_log` table with:
- `from_email` — the address the email was sent from
- `smtp_message_id` — the message ID from the SMTP server
- `status` — `sent`, `failed`, or `pending`
- `template_key` — which template was used (if any)

View logs at **Admin → Email Log**.

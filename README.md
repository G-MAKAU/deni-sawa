# Deni Sawa Partners — SaaS Platform

> **From Special Situations to Best-in-Class**

A full-stack Next.js SaaS platform for Deni Sawa Partners — a Kenyan fractional CFO and business advisory firm. Features AI-powered business health checks, Lexical WYSIWYG report editing, WhatsApp/email delivery, a CMS, and a premium public-facing site.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 6 |
| Styling | Tailwind CSS 3.4 + custom brand theme |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| AI | Anthropic Claude (report generation), Google Gemini (chat) |
| Editor | Lexical 0.49 (WYSIWYG report builder) |
| Email | Nodemailer (dual-domain SMTP routing) |
| WhatsApp | Twilio + Meta Business API |
| PDF/Word | @react-pdf/renderer, pdfkit, docx |
| UI | Radix UI, shadcn/ui, Lucide icons, Framer Motion |
| Deploy | Vercel |

---

## Features

### Public Site
- **Premium photography** — 21 curated Unsplash images across all pages
- **Business Health Checks** — public-facing landing + summary/detailed report viewer with 30-day/12-month expiry
- **Services hub** — Fractional CFO, CEO, Governance, Special Situations sub-pages
- **Learning centre** — Executive Finance programme pages
- **Structured data** — JSON-LD (ProfessionalService, FAQPage, BreadcrumbList, Service)
- **Blog CMS** — admin-created posts with Lexical content, premium cover images
- **Contact/Investor forms** — topic-routed email delivery
- **PWA** — offline support, manifest, service worker
- **SEO** — dynamic sitemap, robots.txt, OpenGraph images

### Admin Dashboard (`/admin`)
- **Health Checks** — manage sessions, questions, report prompts, delivery
- **Report Builder** — Lexical WYSIWYG editor with toolbar (bold, tables, images, background filler)
- **Email Log** — delivery status, retry, CC on all outgoing emails
- **WhatsApp Log** — message delivery tracking
- **Blog Manager** — create/edit posts with Lexical editor
- **Academy** — course management
- **Team** — member management with welcome emails
- **Settings** — SMTP status, site configuration
- **Storage** — file uploads to Supabase

### Report Generation
- **AI-powered** — Claude generates Lexical EditorState JSON from health check answers
- **Dual report types** — Summary (30-day expiry) and Detailed (12-month expiry)
- **Fallback template** — deterministic report when AI fails, admin notified
- **Export** — PDF and Word (gated to detailed reports only)
- **Background filler** — auto-padded, rounded highlight panels for score boxes and callouts

### Email Infrastructure
- **Dual-domain SMTP** — routes emails based on From address domain
- **Admin CC** — all outgoing emails CC'd to admin
- **Cron jobs** — email log cleanup (30 days), failed email retry (max 5 attempts)
- **Templated emails** — branded HTML templates for reports, contact, investor inquiries

---

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/              # Admin dashboard (15 sections)
│   │   ├── api/                # API routes
│   │   │   ├── admin/          # Admin CRUD endpoints
│   │   │   ├── cron/           # Cron: cleanup, retry emails
│   │   │   ├── health-check/   # Public report API + generation
│   │   │   ├── blog/           # Blog CRUD
│   │   │   ├── chat/           # AI chat (Gemini)
│   │   │   ├── whatsapp/       # WhatsApp integration
│   │   │   └── ...
│   │   ├── business-health-checks/
│   │   ├── services/           # Service sub-pages
│   │   └── ...
│   ├── components/             # Shared React components
│   ├── features/
│   │   ├── health-check/       # Health check + report viewer
│   │   └── lexical/            # Lexical editor + plugins
│   ├── lib/                    # Core utilities
│   │   ├── email.ts            # Dual-domain SMTP routing
│   │   ├── generate-report.ts  # AI report generation pipeline
│   │   ├── lexical-report-spec.ts  # Design spec for AI
│   │   ├── css-color.ts        # CSS colour utilities
│   │   └── supabase/           # Supabase client helpers
│   ├── data/                   # Site content + config
│   └── views/                  # Page view components
├── supabase/
│   ├── migrations/             # SQL migrations
│   ├── functions/              # Edge functions
│   └── word-report/            # Word export template
├── public/                     # Static assets + images
├── scripts/                    # Build/download scripts
└── docs/                       # Admin documentation
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase project
- Anthropic API key (for report generation)
- SMTP credentials (Gmail app password recommended)

### Setup

```bash
# Clone
git clone https://github.com/charles-gichuhi-deni-sawa/deni-sawa.git
cd deni-sawa-next

# Install
npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys (see Environment Variables below)

# Download premium images
npm run download-images

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run download-images` | Download premium Unsplash images |

---

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key groups:

| Group | Variables | Purpose |
|-------|-----------|---------|
| **Site** | `NEXT_PUBLIC_SITE_URL` | Base URL |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `*_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Database, auth, storage |
| **AI** | `ANTHROPIC_API_KEY` | Claude report generation |
| **SMTP Primary** | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` | Primary email sending |
| **SMTP Secondary** | `EMAIL2_HOST`, `EMAIL2_PORT`, `EMAIL2_USER`, `EMAIL2_PASS` | Secondary domain routing |
| **WhatsApp** | `TWILIO_*` or `META_WA_*` | WhatsApp Business API |
| **Cron** | `CRON_SECRET` | Auth for cron endpoints |
| **Admin** | `ADMIN_NOTIFY_EMAIL` | CC + failure notifications |

---

## Cron Jobs

Email maintenance runs via external cron (cron-job.org or Vercel Cron).

| Job | Endpoint | Schedule | Purpose |
|-----|----------|----------|---------|
| Cleanup | `/api/cron/cleanup-email-logs` | Daily 03:00 UTC | Delete email logs > 30 days |
| Retry | `/api/cron/retry-failed-emails` | Every 30 min | Retry failed emails (max 5), notify admin |

See [docs/cron-setup.md](docs/cron-setup.md) for cron-job.org setup guide.

---

## Report Generation Flow

1. User completes health check → answers stored in Supabase
2. Admin clicks "Generate" (or auto-generated on submission)
3. `generate-report.ts` builds prompt + Lexical design spec → sends to Claude
4. Claude returns Lexical EditorState JSON
5. Report stored with `expires_at` (summary: 30 days, detailed: 12 months)
6. Branded email sent with report link + admin CC
7. Public viewer at `/report/[token]` renders the Lexical content
8. Summary reports: view only. Detailed reports: PDF/Word export available

---

## Dual-Domain SMTP

Emails route to the SMTP profile that owns the `From` domain:

- **Primary** (Gmail): `smtp.gmail.com:587` — unknown domains
- **Secondary** (Domain): `mail.teti.ac.ke:465` — `denisawa.co.ke`, `teti.ac.ke`

All outgoing emails are CC'd to `ADMIN_NOTIFY_EMAIL`.

---

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git push origin master

# Import in Vercel dashboard
# Set environment variables
# Deploy
```

### Cron Jobs on Vercel

Rename `vercel_.json` → `vercel.json` to enable Vercel Cron (Pro plan required). Otherwise use [cron-job.org](https://cron-job.org) — see [docs/cron-setup.md](docs/cron-setup.md).

---

## Database

Supabase PostgreSQL with migrations in `supabase/migrations/`. Key tables:

- `health_check_sessions` — assessment sessions
- `health_check_reports` — generated reports (summary/detailed)
- `health_check_report_prompts` — AI prompts per health check
- `email_log` — delivery tracking with retry counts
- `blog_posts` — CMS content
- `site_settings` — site configuration

---

## Documentation

- [docs/admin-health-checks.md](docs/admin-health-checks.md) — Admin health check management
- [docs/cron-setup.md](docs/cron-setup.md) — Cron job setup with cron-job.org

---

## License

Private — Deni Sawa Partners. All rights reserved.

'use client';

import * as React from 'react';
import {
  Activity, BookOpen, BookMarked, Building2, CheckCircle2, ClipboardList, FileText, GraduationCap,
  Globe, Image as ImageIcon, Info, KeyRound, LayoutDashboard, ListChecks, Lock, Mail, MailOpen,
  MessageCircle, MessageSquare, Network, PenLine, Plug, Save, Search, Send, Settings,
  ShieldCheck, SlidersHorizontal, Sparkles, StickyNote, Table2, Upload, Users, Webhook,
  Zap, type LucideIcon,
} from 'lucide-react';
import { PageHeader, StatusPill } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────────────────────
   Documentation content model
   ──────────────────────────────────────────────────────────────────────────── */

interface DocTip {
  tone: 'info' | 'success' | 'warning';
  text: string;
}

interface DocCard {
  title: string;
  icon?: LucideIcon;
  description?: string;
  body: React.ReactNode;
}

interface DocSection {
  id: string;
  label: string;
  icon: LucideIcon;
  tagline: string;
  intro: string;
  cards: DocCard[];
  tips?: DocTip[];
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-[var(--a-subtle)] px-1.5 py-0.5 font-mono text-[11px] text-[#c94508] dark:text-[#E8510A]">
      {children}
    </code>
  );
}

function Endpoint({ method, path }: { method: 'GET' | 'POST' | 'PUT' | 'DELETE'; path: string }) {
  const tones: Record<'GET' | 'POST' | 'PUT' | 'DELETE', string> = {
    GET: 'bg-sky-500/10 text-sky-600 border-sky-500/25',
    POST: 'bg-[#5A9E28]/10 text-[#3f7a1a] border-[#5A9E28]/25',
    PUT: 'bg-amber-500/10 text-amber-700 border-amber-500/25',
    DELETE: 'bg-red-500/10 text-red-600 border-red-500/25',
  };
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-[var(--a-border)] bg-[var(--a-subtle)] px-2.5 py-1 font-mono text-[11px] text-[var(--a-ink2)]">
      <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider', tones[method])}>{method}</span>
      {path}
    </span>
  );
}

const SECTIONS: DocSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Sparkles,
    tagline: 'How the admin console works',
    intro:
      'The Deni Sawa admin console is a protected control centre for the website. Every module is guarded by role-based access — administrators sign in with their Supabase account and every mutating action is audited with the acting admin\u2019s identity.',
    cards: [
      {
        title: 'Getting started',
        icon: KeyRound,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>
              Visit <Code>/admin/login</Code>, sign in with your Supabase account and you land on the{' '}
              <strong className="text-[var(--a-ink2)]">Dashboard</strong>. Your role badge (Super Admin, Admin, Manager
              or Support) is shown in the top-right and controls what you can see and do.
            </p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Use the <strong>dark / light</strong> toggle and your <strong>account</strong> modal to update your display name or change your password.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>The mobile menu (top-left) exposes the same navigation in a drawer.</span></li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Roles & permissions',
        icon: ShieldCheck,
        body: (
          <div className="space-y-3 text-sm text-[var(--a-text2)]">
            <p>Permissions are enforced per operation (read / create / update / delete) on every API route.</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] px-3 py-2">
                <span className="text-[13px] font-semibold text-[var(--a-ink2)]">Super Admin</span>
                <StatusPill tone="orange">Full access</StatusPill>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] px-3 py-2">
                <span className="text-[13px] font-semibold text-[var(--a-ink2)]">Admin</span>
                <StatusPill tone="green">Full access</StatusPill>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] px-3 py-2">
                <span className="text-[13px] font-semibold text-[var(--a-ink2)]">Manager</span>
                <StatusPill tone="blue">Content & templates</StatusPill>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] px-3 py-2">
                <span className="text-[13px] font-semibold text-[var(--a-ink2)]">Support</span>
                <StatusPill tone="grey">Read & delivery</StatusPill>
              </div>
            </div>
            <p className="text-xs text-[var(--a-muted)]">Manage roles on the Team page.</p>
          </div>
        ),
      },
    ],
    tips: [
      { tone: 'info', text: 'All changes are saved against your admin account and shown as \u201cUpdated by\u201d in most modules.' },
      { tone: 'success', text: 'There is no separate \u201cconfiguration required\u201d step — the console works as soon as you log in.' },
    ],
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    tagline: 'At-a-glance business health',
    intro:
      'The dashboard summarises the whole platform: active health checks, recent sessions, report generation activity and engagement totals.',
    cards: [
      {
        title: 'Key metrics',
        icon: Activity,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong className="text-[var(--a-ink2)]">Active checks</strong> — health checks enabled on the public site.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong className="text-[var(--a-ink2)]">Sessions</strong> — assessments started by visitors, with completion status.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong className="text-[var(--a-ink2)]">Reports</strong> — generated diagnostics, delivery method and state.</span></li>
            </ul>
          </div>
        ),
      },
    ],
    tips: [{ tone: 'info', text: 'Click any count to jump into the corresponding management page.' }],
  },
  {
    id: 'health-checks',
    label: 'Health Checks',
    icon: Activity,
    tagline: 'The assessment engine',
    intro:
      'Health checks are the AI-powered assessments at the heart of the platform. Each check bundles a set of sections, questions, answer prompts, delivery settings and a report template. Two slugs are reserved and locked: business-health-check and professional-financial-health-check.',
    cards: [
      {
        title: 'Check fields',
        icon: Settings,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Each health check has the following fields:</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Name</strong> — the check&rsquo;s display name shown in the admin list and on the public page.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Slug</strong> — the URL path segment (e.g. <Code>/business-health-checks/my-check</Code>). Reserved slugs show a &ldquo;Locked&rdquo; badge and cannot be changed.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Tagline</strong> — a short subtitle displayed under the check name on the public page.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Description</strong> — a longer explanation of what the check assesses, shown on the public landing page.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Image</strong> — the hero image for the public page. Upload via the storage picker or paste a URL.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Duration estimate</strong> — how long the assessment takes (e.g. &ldquo;10 minutes&rdquo;). Shown to visitors before they start.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Audience</strong> — who the check is for (e.g. &ldquo;Business Owners&rdquo;, &ldquo;Finance Professionals&rdquo;). Displayed on the public page.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Provider</strong> — the LLM provider used for report generation. Uses DB-stored AI settings with env fallback.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Model</strong> — the specific AI model (e.g. Claude Sonnet, GPT-4o). Selected from the provider&rsquo;s available models.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Max tokens</strong> — caps the AI response length. Higher values produce longer reports but cost more.</span></li>
            </ul>
            <div className="space-y-2">
              <Endpoint method="GET" path="/api/admin/health-checks" />
              <Endpoint method="POST" path="/api/admin/health-checks" />
              <Endpoint method="PUT" path="/api/admin/health-checks/:id" />
              <Endpoint method="DELETE" path="/api/admin/health-checks/:id" />
            </div>
          </div>
        ),
      },
      {
        title: 'Section fields',
        icon: Table2,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Sections group related questions within a health check. Each section has:</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Title</strong> — the section heading shown to visitors during the assessment.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Description</strong> — optional context shown below the title to guide the visitor.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Sort order</strong> — controls the display sequence. Lower numbers appear first.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Active</strong> — toggle to include or exclude the section from the assessment.</span></li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Question fields',
        icon: ListChecks,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Questions are the individual items visitors answer. Each question has:</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Text</strong> — the question prompt shown to the visitor.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Type</strong> — how the answer is captured: text input, multiple choice, scale (1&ndash;5 or 1&ndash;10), yes/no, or file upload.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Options</strong> — for multiple-choice questions, the list of possible answers.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Required</strong> — whether the visitor must answer before proceeding.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Sort order</strong> — controls the display sequence within the section.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Active</strong> — toggle to include or exclude the question from the assessment.</span></li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Prompt fields',
        icon: PenLine,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Prompts are the AI instructions that turn raw answers into a polished, branded diagnostic report. Each section can have its own prompt for more targeted analysis.</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Section prompt</strong> — instructions specific to that section&rsquo;s questions and answers.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Global prompt</strong> — overall instructions for the entire report (tone, branding, structure).</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>The AI generates a full <strong>Lexical JSON state</strong> with headings, lists, tables, callouts and styled text.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>The model spec includes a few-shot example so the output is consistently structured and on-brand.</span></li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Rate limits',
        icon: Lock,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Protect the platform and the AI budget. Configure monthly limits per IP, per email and per WhatsApp number for each check.</p>
            <div className="space-y-2">
              <Endpoint method="GET" path="/api/admin/rate-limits" />
              <Endpoint method="PUT" path="/api/admin/rate-limits/:id" />
            </div>
          </div>
        ),
      },
      {
        title: 'Delivery',
        icon: Send,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Decide how completed reports reach visitors. Choose the email template and WhatsApp template used for report delivery, plus consent requirements.</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Select the <strong>email template</strong> and <strong>WhatsApp template</strong> for each check.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Delivery only succeeds when the chosen templates are active.</span></li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Sessions',
        icon: ClipboardList,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Every visitor assessment, in progress or complete. Inspect answers, status and contact details, and resend delivery when needed.</p>
          </div>
        ),
      },
      {
        title: 'Report editor',
        icon: FileText,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>The <strong>Lexical report editor</strong> gives you full control over generated reports before delivery. Every report is a rich Lexical document that can be refined with a word-processor-like experience.</p>
            <p className="font-semibold text-[var(--a-ink2)]">Available blocks:</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Headings</strong> (H1, H2, H3), <strong>paragraphs</strong>, <strong>lists</strong> (bullet, number, check) and <strong>quotes</strong>.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Tables</strong> — click a cell to edit; select cells and use the toolbar to set background colour on individual or multiple cells.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Callouts</strong> — brand, growth or dark tone, for highlighting key findings.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Page breaks</strong> — dashed rule that forces a new page in PDF/Word exports. Insert via the toolbar block dropdown.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Sticky notes</strong> — coloured note cards (yellow, green, blue) for client takeaways. Insert via the toolbar block dropdown.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Images</strong> — upload or pick from the media library, with layout options (inline, square, behind, etc.).</span></li>
            </ul>
            <p className="font-semibold text-[var(--a-ink2)]">Inline formatting:</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Bold, italic, underline, strikethrough, inline code, subscript/superscript.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Text colour</strong> — set via the toolbar for verdicts, ratings and key figures.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Block background</strong> — paragraph/heading tint for inline callouts.</span></li>
            </ul>
            <p className="font-semibold text-[var(--a-ink2)]">Table cell background:</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Click a single cell, then use the background colour picker in the toolbar.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Multi-cell</strong>: drag across cells or shift-click to select multiple, then apply colour to all at once.</span></li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Report delivery & export',
        icon: Globe,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Once a report is finalised, deliver it to the visitor or export it for offline use.</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Re-deliver</strong> — send via email or WhatsApp directly from the admin.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Export PDF</strong> — renders the Lexical state into a branded, print-ready PDF.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Export Word</strong> — downloads a .docx file for offline editing.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Page breaks in the editor map to page boundaries in both export formats.</span></li>
            </ul>
          </div>
        ),
      },
    ],
    tips: [
      { tone: 'warning', text: 'Reports are generated with the configured AI provider — generation can take 30–60 seconds depending on model and section count.' },
      { tone: 'info', text: 'Reserved slugs (business-health-check, professional-financial-health-check) are locked both server-side and in the admin UI.' },
      { tone: 'success', text: 'The report editor auto-saves your work. Use Ctrl+S to save manually at any time.' },
    ],
  },
  {
    id: 'email',
    label: 'Email Templates',
    icon: Mail,
    tagline: 'Branded, variable-driven emails',
    intro:
      'Every outbound email (report delivery, consent confirmations) uses a template. Templates store subject, preview text, sender identity and an HTML body with {{variable}} placeholders.',
    cards: [
      {
        title: 'Editing a template',
        icon: PenLine,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Use the <strong>editor / preview</strong> tabs — the preview renders a realistic email-client mockup in light and dark mode.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Click a <strong>variable chip</strong> or the toolbar dropdown to insert {'{{variable}}'} tokens; green chips are referenced in the body, orange ones are unused.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Insert images by upload or from storage, and set the sender name, sender email and reply-to.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Send test email</strong> fills variables with your chosen values and delivers to a real inbox.</span></li>
            </ul>
            <p className="text-xs text-[var(--a-muted)]">The stored body is unbranded; the branded shell (logo, footer, colours) is applied at send time.</p>
          </div>
        ),
      },
      {
        title: 'API reference',
        icon: Plug,
        body: (
          <div className="flex flex-wrap items-center gap-2">
            <Endpoint method="GET" path="/api/admin/email-templates" />
            <Endpoint method="GET" path="/api/admin/email-templates/:key" />
            <Endpoint method="PUT" path="/api/admin/email-templates/:key" />
            <Endpoint method="POST" path="/api/admin/email-templates/test" />
          </div>
        ),
      },
      {
        title: 'Email log',
        icon: MailOpen,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Every send is recorded — recipient, subject, status (pending / sent / failed / bounced), SMTP message ID and the variables used. Use it to debug delivery and confirm reports reached visitors.</p>
          </div>
        ),
      },
    ],
    tips: [
      { tone: 'warning', text: 'SMTP must be configured via EMAIL_HOST / EMAIL_USER / EMAIL_PASS environment variables for sends to succeed.' },
      { tone: 'success', text: 'Templates support variables in subject, preview text and body.' },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    tagline: 'Business messaging with Meta',
    intro:
      'Deliver reports over WhatsApp using pre-approved templates. The console supports Twilio, Meta Cloud API and Infobip; the Meta Cloud API is the primary path.',
    cards: [
      {
        title: 'Templates & approval',
        icon: MessageSquare,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>WhatsApp only allows <strong>pre-approved templates</strong>. Each template has a status lifecycle:</p>
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <StatusPill tone="grey">draft</StatusPill> <Zap className="h-3 w-3 text-[var(--a-muted)]" />
              <StatusPill tone="amber">submitted</StatusPill> <Zap className="h-3 w-3 text-[var(--a-muted)]" />
              <StatusPill tone="green">approved</StatusPill> <Zap className="h-3 w-3 text-[var(--a-muted)]" />
              <StatusPill tone="red">rejected</StatusPill>
            </div>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Set the <strong>category</strong> (MARKETING / UTILITY / AUTHENTICATION) and <strong>language</strong> Meta requires.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Variables are inserted in order — Meta positions them positionally, so the order of {'{{variables}}'} in the body must match.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Only <strong>approved</strong> templates can be activated for live delivery.</span></li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Configuration',
        icon: Plug,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>For the Meta Cloud API supply the <strong>Phone number ID</strong> and a <strong>system user access token</strong>. Secrets are encrypted with AES-256-GCM before storage and never returned to the browser.</p>
            <div className="space-y-2">
              <Endpoint method="GET" path="/api/admin/whatsapp-config" />
              <Endpoint method="PUT" path="/api/admin/whatsapp-config" />
              <Endpoint method="POST" path="/api/admin/whatsapp-config/test" />
            </div>
          </div>
        ),
      },
      {
        title: 'Webhook (Meta Cloud API)',
        icon: Webhook,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Register the webhook URL in the Meta developer app to receive delivery receipts and template approval events.</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>URL: <Code>/api/whatsapp/webhook</Code> — copy it from the config page.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Generate a <strong>verify token</strong> and paste the same value into Meta&rsquo;s Verify Token field.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Message statuses (<Code>sent / delivered / read / failed</Code>) update the WhatsApp log automatically.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Template approval events flip templates to approved / rejected and store the WhatsApp template ID.</span></li>
            </ul>
          </div>
        ),
      },
      {
        title: 'WhatsApp log',
        icon: MessageSquare,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Every message attempt is logged with provider, status, variables and timestamps — delivered / read timestamps arrive via the webhook.</p>
          </div>
        ),
      },
    ],
    tips: [
      { tone: 'warning', text: 'Meta only sends template messages to numbers that have opted in. Use the 24-hour session window for free-form replies.' },
      { tone: 'info', text: 'If the send fails with a template error, confirm the template is approved, active and its language matches the recipient\u2019s.' },
    ],
  },
  {
    id: 'blog',
    label: 'Blog',
    icon: PenLine,
    tagline: 'Publish articles & insights',
    intro:
      'Write, categorise and publish blog posts with a full Lexical editor, cover images and SEO metadata. Every post is stored in the database and served dynamically.',
    cards: [
      {
        title: 'Post fields',
        icon: FileText,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Each blog post has the following fields:</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Title</strong> — the post headline, displayed on the public listing and as the page H1.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Slug</strong> — the URL path segment (e.g. <Code>/about/blog/my-post</Code>). Auto-generated from the title but editable.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Excerpt</strong> — a short summary shown on the blog listing card and in social share previews.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Content</strong> — the full post body in the Lexical editor. Supports headings, paragraphs, lists, images, links, callouts and code blocks.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Category</strong> — groups posts (e.g. Debt Management, Financial Wellness, Leadership). Used for filtering on the public blog page.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Author</strong> — the post author shown on the public page. Select from the admin team or enter a custom name.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Cover image</strong> — the hero image for the post. Upload via the media library or paste a URL. Used on the listing card and at the top of the post.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Published</strong> — toggle to make the post visible publicly. Drafts are only visible in the admin.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Publish date</strong> — controls the displayed date and sort order. Defaults to now but can be backdated or scheduled.</span></li>
            </ul>
          </div>
        ),
      },
      {
        title: 'SEO fields',
        icon: Globe,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Every post has dedicated SEO fields for search engine optimisation:</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>SEO title</strong> — overrides the page &lt;title&gt; tag. Falls back to the post title if empty.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>SEO description</strong> — the meta description shown in search results. Falls back to the excerpt.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Open Graph and Twitter card tags are generated automatically from these fields.</span></li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Comments',
        icon: MessageSquare,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Readers can leave comments on published posts. All comments are managed from the admin:</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>AI moderation</strong> — when enabled, each comment is screened for spam, toxicity and relevance before appearing publicly.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Moderation queue</strong> — flagged comments appear in the admin for manual approve / reject / delete.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Comment count is displayed on the public post page.</span></li>
            </ul>
            <div className="space-y-2">
              <Endpoint method="GET" path="/api/admin/blog/posts" />
              <Endpoint method="POST" path="/api/admin/blog/posts" />
              <Endpoint method="PUT" path="/api/admin/blog/posts/:id" />
              <Endpoint method="DELETE" path="/api/admin/blog/posts/:id" />
              <Endpoint method="GET" path="/api/admin/blog/comments" />
              <Endpoint method="PUT" path="/api/admin/blog/comments/:id" />
            </div>
          </div>
        ),
      },
    ],
    tips: [
      { tone: 'info', text: 'Posts are served dynamically from the database. The blog listing page caches for 10 minutes (ISR).' },
      { tone: 'success', text: 'Use the Lexical editor toolbar to insert images from the media library — they are uploaded automatically.' },
    ],
  },
  {
    id: 'academy',
    label: 'Academy',
    icon: GraduationCap,
    tagline: 'LMS course catalogue',
    intro:
      'Manage the academy course catalogue shown on the public Academy page. Courses carry a title, category, format, duration, level, description and an optional cover image. The public catalogue pulls live from the database and falls back to the static catalogue if empty.',
    cards: [
      {
        title: 'Course fields',
        icon: FileText,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Each course has the following fields:</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Title</strong> — the course name displayed on the public listing card.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Category</strong> — groups courses (e.g. Financial Management, Leadership, Governance). Used for filtering on the public page.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Format</strong> — how the course is delivered: Online, In-Person, Hybrid, or Self-Paced.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Duration</strong> — the time commitment (e.g. &ldquo;4 weeks&rdquo;, &ldquo;2 days&rdquo;, &ldquo;6 hours&rdquo;).</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Level</strong> — the difficulty tier: Beginner, Intermediate, Advanced, or Executive.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Description</strong> — a detailed summary of what the course covers, prerequisites and outcomes.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Cover image</strong> — the hero image for the course card. Upload via the media library or paste a URL.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Featured</strong> — toggle to highlight the course at the top of the public listing.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Active</strong> — toggle to show or hide the course on the public catalogue. Inactive courses are admin-only.</span></li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Managing courses',
        icon: Settings,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Click <strong>Add Course</strong> to open the modal form with all fields above.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Click any row to edit an existing course — the same modal opens pre-filled.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Use the <strong>Delete</strong> action to permanently remove a course (requires confirmation).</span></li>
            </ul>
            <div className="space-y-2">
              <Endpoint method="GET" path="/api/admin/academy/courses" />
              <Endpoint method="POST" path="/api/admin/academy/courses" />
              <Endpoint method="PUT" path="/api/admin/academy/courses/:id" />
              <Endpoint method="DELETE" path="/api/admin/academy/courses/:id" />
            </div>
          </div>
        ),
      },
    ],
    tips: [
      { tone: 'success', text: 'Upload images under 5MB (JPEG, PNG, GIF, WebP) from the course form.' },
      { tone: 'info', text: 'The public Academy page shows active courses grouped by category. Featured courses appear first.' },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    icon: Users,
    tagline: 'Admins & roles',
    intro: 'Invite colleagues, assign roles and disable access. Role changes take effect on their next request.',
    cards: [
      {
        title: 'Managing administrators',
        icon: ShieldCheck,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Invite by email — the invitee receives a sign-up / password-reset flow.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Change roles and disable accounts inline.</span></li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: Upload,
    tagline: 'Images & media library',
    intro: 'The storage manager browses every public bucket, uploads new assets, deletes stale ones and reports quota usage.',
    cards: [
      {
        title: 'Working with media',
        icon: BookMarked,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Upload files into a folder; everything is stored in Supabase Storage.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Any image you upload here can be picked later from the <strong>image picker</strong> in blog, email, report and academy forms.</span></li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: 'ai-settings',
    label: 'AI Settings',
    icon: Sparkles,
    tagline: 'Configure AI providers and models',
    intro:
      'The AI Settings page lets you configure which LLM providers and models power report generation and comment moderation. Settings are stored in the database and secrets are encrypted with AES-256-GCM.',
    cards: [
      {
        title: 'Provider configuration',
        icon: Plug,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>Choose from pre-configured provider presets or set up a custom OpenAI-compatible endpoint:</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Anthropic</strong> — Claude models (Opus, Sonnet, Haiku). Requires an Anthropic API key.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>OpenAI</strong> — GPT-4o, GPT-4.1, etc. Requires an OpenAI API key.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Google</strong> — Gemini models. Requires a Google AI Studio API key.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>OpenRouter</strong> — access to multiple providers through a single key.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>DeepSeek, Qwen, Kimi, Groq</strong> — other supported providers with native integration.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Custom</strong> — any OpenAI-compatible API (e.g. self-hosted, Azure, Fireworks). Enter the base URL and API key manually.</span></li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Model picker',
        icon: ListChecks,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>After selecting a provider, the model picker fetches available models live from the provider&rsquo;s API. Pick the default model for report generation and comment moderation.</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Primary model</strong> — used for health check report generation.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Fallback provider</strong> — automatically used if the primary provider fails or is unavailable.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Comment moderation model</strong> — the model used for AI-powered comment screening.</span></li>
            </ul>
            <div className="space-y-2">
              <Endpoint method="GET" path="/api/admin/settings" />
              <Endpoint method="PUT" path="/api/admin/settings" />
              <Endpoint method="GET" path="/api/admin/models" />
            </div>
          </div>
        ),
      },
      {
        title: 'Security',
        icon: ShieldCheck,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>API keys are encrypted with <strong>AES-256-GCM</strong> before storage using the <Code>CREDENTIALS_ENCRYPTION_KEY</Code> env var.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Settings are only readable by <strong>Super Admin</strong> and <strong>Admin</strong> roles. The GET endpoint returns masked values.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Only whitelisted keys can be updated — the allowlist prevents accidental exposure of internal fields.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Env vars (<Code>ANTHROPIC_API_KEY</Code>, <Code>OPENAI_API_KEY</Code>, etc.) serve as fallback if no DB setting is configured.</span></li>
            </ul>
          </div>
        ),
      },
    ],
    tips: [
      { tone: 'warning', text: 'Changing the primary model takes effect on the next report generation — already-queued jobs continue with the previous model.' },
      { tone: 'info', text: 'The fallback chain is: DB settings → env vars → error. At least one provider must be configured for reports to generate.' },
    ],
  },
  {
    id: 'comment-moderation',
    label: 'Comment Moderation',
    icon: MessageSquare,
    tagline: 'AI-powered comment screening',
    intro:
      'Blog comments can be automatically screened by AI before they appear publicly. The system checks for spam, toxicity, off-topic content and flags inappropriate submissions for admin review.',
    cards: [
      {
        title: 'How it works',
        icon: Sparkles,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>A visitor submits a comment on a blog post.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>The AI reviews the comment content, author name and email for spam indicators, toxicity and relevance.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Approved</strong> comments appear immediately. <strong>Rejected</strong> comments are hidden. <strong>Flagged</strong> comments go to the moderation queue for admin review.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>The AI verdict and reasoning are shown on each comment in the admin moderation UI.</span></li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Configuration',
        icon: Settings,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Toggle AI moderation on/off in <strong>Admin Settings</strong> via the <Code>COMMENT_AI_MODERATION_ENABLED</Code> key.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Uses the same provider chain as report generation (DB settings → env fallback).</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>If the AI service is unavailable, comments default to <strong>approved</strong> (fail-open) so legitimate comments are not lost.</span></li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Moderation queue',
        icon: ClipboardList,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <p>The admin moderation page shows all comments with their AI verdict, reason and status. Admins can approve, reject or delete any comment regardless of the AI decision.</p>
            <div className="space-y-2">
              <Endpoint method="GET" path="/api/admin/blog/comments" />
              <Endpoint method="PUT" path="/api/admin/blog/comments/:id" />
              <Endpoint method="DELETE" path="/api/admin/blog/comments/:id" />
            </div>
          </div>
        ),
      },
    ],
    tips: [
      { tone: 'info', text: 'AI moderation uses the same model configured in AI Settings for comment moderation. Switch providers there.' },
      { tone: 'warning', text: 'Disabling AI moderation means all comments appear immediately without screening. Use the admin queue to moderate manually.' },
    ],
  },
  {
    id: 'settings',
    label: 'Site Settings',
    icon: SlidersHorizontal,
    tagline: 'Site-wide behaviour',
    intro: 'Central settings that shape public behaviour — including the consent and cookie banner used across the site.',
    cards: [
      {
        title: 'What you can change',
        icon: Settings,
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--a-text2)]">
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>Cookie / consent banner</strong> — enabled/disabled site-wide, including GA4 consent gating.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Health check consent requirements and other behavioural toggles.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span><strong>AI comment moderation</strong> — toggle automatic comment screening on/off.</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A9E28]" /><span>Everything is saved through authenticated admin endpoints with audit fields.</span></li>
            </ul>
          </div>
        ),
      },
    ],
  },
];

/* ────────────────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────────────────── */

const TIP_STYLES: Record<DocTip['tone'], { wrap: string; icon: LucideIcon }> = {
  info: { wrap: 'border-sky-500/25 bg-sky-500/5 text-sky-700 dark:text-sky-300', icon: Info },
  success: { wrap: 'border-[#5A9E28]/25 bg-[#5A9E28]/5 text-[#3f7a1a]', icon: CheckCircle2 },
  warning: { wrap: 'border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-300', icon: Info },
};

function Tip({ tip }: { tip: DocTip }) {
  const style = TIP_STYLES[tip.tone];
  const Icon = style.icon;
  return (
    <div className={cn('flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[13px] leading-relaxed', style.wrap)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{tip.text}</span>
    </div>
  );
}

export function DocsClient() {
  const [query, setQuery] = React.useState('');
  const [activeId, setActiveId] = React.useState(SECTIONS[0].id);
  const isScrollingRef = React.useRef(false);

  const q = query.trim().toLowerCase();
  const sections = q
    ? SECTIONS.map((section) => ({
        ...section,
        cards: section.cards.filter(
          (card) =>
            card.title.toLowerCase().includes(q) ||
            card.description?.toLowerCase().includes(q) ||
            (typeof card.body === 'string' ? card.body.toLowerCase().includes(q) : true)
        ),
      })).filter((section) => section.cards.length > 0 || section.label.toLowerCase().includes(q) || section.tagline.toLowerCase().includes(q))
    : SECTIONS;

  /* Scroll-spy: observe all doc sections and highlight the sidebar item
     whose section is closest to the top of the viewport. */
  React.useEffect(() => {
    const sectionEls = sections
      .map((s) => document.getElementById(`doc-${s.id}`))
      .filter(Boolean) as HTMLElement[];
    if (sectionEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        // Pick the entry whose top is closest to (but below) the viewport top.
        let best: { id: string; top: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id.replace(/^doc-/, '');
          const top = entry.boundingClientRect.top;
          if (!best || (top >= 0 && top < best.top) || (top < 0 && top > best.top)) {
            best = { id, top };
          }
        }
        if (best) setActiveId(best.id);
      },
      { rootMargin: '-10% 0px -75% 0px', threshold: 0 }
    );

    for (const el of sectionEls) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    setActiveId(id);
    isScrollingRef.current = true;
    document.getElementById(`doc-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { isScrollingRef.current = false; }, 800);
  };

  /* Keep the active sidebar item scrolled into view within the sticky panel. */
  React.useEffect(() => {
    const btn = document.getElementById(`sidebar-${activeId}`);
    btn?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeId]);

  return (
    <>
      <PageHeader
        title="Documentation"
        subtitle="A complete guide to every admin module, page and API."
        crumbs={[{ label: 'Documentation' }]}
      />

      {/* Search */}
      <div className="relative mb-6 max-w-xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--a-placeholder)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the admin guide… (e.g. webhook, template, image)"
          className="h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] pl-10 pr-4 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        {/* Sidebar nav */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] p-2">
            <p className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--a-muted)]">On this page</p>
            <ul className="space-y-0.5">
              {sections.map((section) => {
                const Icon = section.icon;
                const active = activeId === section.id;
                return (
                  <li key={section.id}>
                    <button
                      id={`sidebar-${section.id}`}
                      type="button"
                      onClick={() => scrollTo(section.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors',
                        active ? 'bg-[#E8510A]/10 text-[#E8510A]' : 'text-[var(--a-text)] hover:bg-[var(--a-subtle)]'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-[#E8510A]' : 'text-[var(--a-muted)]')} />
                      {section.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 space-y-10">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.id} id={`doc-${section.id}`} className="scroll-mt-24">
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8510A]/10 text-[#E8510A]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="font-heading text-lg font-bold text-[var(--a-ink)]">{section.label}</h2>
                      <p className="text-xs font-medium uppercase tracking-wider text-[var(--a-muted)]">{section.tagline}</p>
                    </div>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--a-text2)]">{section.intro}</p>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {section.cards.map((card) => {
                    const CardIcon = card.icon;
                    return (
                      <div
                        key={card.title}
                        className="rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                      >
                        <header className="flex items-center gap-2.5 border-b border-[var(--a-border-soft)] px-5 py-3.5">
                          {CardIcon && <CardIcon className="h-4 w-4 text-[#E8510A]" />}
                          <h3 className="font-heading text-sm font-semibold text-[var(--a-ink2)]">{card.title}</h3>
                        </header>
                        <div className="px-5 py-4">{card.body}</div>
                      </div>
                    );
                  })}
                </div>

                {section.tips && section.tips.length > 0 && (
                  <div className="mt-4 space-y-2.5">
                    {section.tips.map((tip, i) => (
                      <Tip key={i} tip={tip} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {sections.length === 0 && (
            <div className="rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-6 py-16 text-center">
              <Search className="mx-auto mb-3 h-8 w-8 text-[var(--a-placeholder)]" />
              <p className="text-sm font-semibold text-[var(--a-ink2)]">No results for &ldquo;{query}&rdquo;</p>
              <p className="mt-1 text-xs text-[var(--a-muted)]">Try a different keyword like &ldquo;webhook&rdquo;, &ldquo;template&rdquo; or &ldquo;report&rdquo;.</p>
            </div>
          )}

          <div className="rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5A9E28]/10 text-[#5A9E28]">
                <Building2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--a-ink2)]">Deployment notes</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--a-muted)]">
                  Database schema changes live in <Code>supabase/migrations</Code>. Run <Code>supabase db push</Code> to
                  apply pending migrations before the new columns appear in the console.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-[var(--a-text2)]">
              <p className="font-semibold text-[var(--a-ink2)]">Required migrations:</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5A9E28]" /><span><Code>20260814000001_create_health_checks.sql</Code> — health check tables, report editing columns.</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5A9E28]" /><span><Code>20260820000001_create_app_settings.sql</Code> — DB-managed AI provider settings.</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5A9E28]" /><span><Code>20260822000001_add_ai_comment_moderation.sql</Code> — comment moderation fields.</span></li>
              </ul>
              <p className="font-semibold text-[var(--a-ink2)]">Environment variables:</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5A9E28]" /><span><strong>Bootstrap (always in Vercel)</strong>: <Code>NEXT_PUBLIC_SUPABASE_URL</Code>, <Code>NEXT_PUBLIC_SUPABASE_ANON_KEY</Code>, <Code>SUPABASE_SERVICE_ROLE_KEY</Code>, <Code>CREDENTIALS_ENCRYPTION_KEY</Code>.</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5A9E28]" /><span><strong>AI fallback (optional)</strong>: <Code>ANTHROPIC_API_KEY</Code>, <Code>OPENAI_API_KEY</Code>, <Code>GOOGLE_AI_API_KEY</Code>, <Code>OPENROUTER_API_KEY</Code> — used when no DB setting is configured.</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5A9E28]" /><span><strong>Email</strong>: <Code>EMAIL_HOST</Code>, <Code>EMAIL_USER</Code>, <Code>EMAIL_PASS</Code> (primary) and <Code>EMAIL2_*</Code> (secondary profile).</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5A9E28]" /><span><strong>WhatsApp</strong>: <Code>WHATSAPP_ACCESS_TOKEN</Code>, <Code>WHATSAPP_PHONE_NUMBER_ID</Code> (or configure via admin UI).</span></li>
              </ul>
              <p className="font-semibold text-[var(--a-ink2)]">Key architecture decisions:</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5A9E28]" /><span>AI provider keys are stored in the <Code>app_settings</Code> table, encrypted with AES-256-GCM. The admin UI shows masked values — full keys are never returned to the browser.</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5A9E28]" /><span>Env vars serve as fallback when no DB setting exists. The resolution order is: DB setting → env var → error.</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5A9E28]" /><span>The report editor stores a Lexical JSON state. Page breaks and sticky notes survive export to PDF/Word.</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5A9E28]" /><span>Comment moderation is fail-open: if the AI is unavailable, comments are approved automatically so legitimate submissions are not lost.</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
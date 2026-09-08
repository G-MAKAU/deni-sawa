'use client';

import { useState, useCallback } from 'react';
import { Send, Loader2, CheckCircle2, MessageCircle, Phone, Mail, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { business } from '@/data/content';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { ObfuscatedEmail } from '@/components/ObfuscatedEmail';
import type { EditorState } from 'lexical';
import { lexicalToHtml } from '@/lib/lexical-to-html';

interface BookResult {
  ok: boolean;
  stored: boolean;
  reference: string;
  whatsapp: string;
  mailto: string;
  errors?: string[];
}

const serviceOptions = [
  { value: 'General Enquiry', label: 'General Enquiry' },
  { value: 'Business Support — Fractional CFO', label: 'Business Support — Fractional CFO' },
  { value: 'Business Support — Fractional CEO', label: 'Business Support — Fractional CEO' },
  { value: 'Business Support — Governance & Controls', label: 'Business Support — Governance & Controls' },
  { value: 'Business Support — Growth & Development', label: 'Business Support — Growth & Development' },
  { value: 'Business Support — Special Situations', label: 'Business Support — Special Situations' },
  { value: 'Business Health Check', label: 'Business Health Check' },
  { value: 'Professional Financial Health Check', label: 'Professional Financial Health Check' },
  { value: 'Learning — Executive Finance Programme', label: 'Learning — Executive Finance Programme' },
  { value: 'Learning Pathway — Business Recovery', label: 'Learning Pathway — Business Recovery' },
  { value: 'Learning Pathway — Governance', label: 'Learning Pathway — Governance' },
  { value: 'Learning Pathway — Financial Resilience', label: 'Learning Pathway — Financial Resilience' },
  { value: 'Investor Services', label: 'Investor Services' },
  { value: 'SpecialSit Network Membership', label: 'SpecialSit Network Membership' },
  { value: 'Partnership / Media Enquiry', label: 'Partnership / Media Enquiry' },
];

export function ContactFormNew({ initialSubject }: { initialSubject?: string }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [service, setService] = useState(initialSubject ?? '');
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<BookResult | null>(null);

  const handleEditorChange = useCallback((state: EditorState) => {
    setEditorState(state);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);
    setResult(null);

    let message = '';
    if (editorState) {
      const stateJson = editorState.toJSON();
      const root = stateJson.root as Record<string, unknown>;
      const children = root?.children as Array<Record<string, unknown>> | undefined;
      const hasContent = children?.some((child) => {
        const childChildren = child.children as Array<Record<string, unknown>> | undefined;
        return childChildren?.some((gc) => typeof gc.text === 'string' && gc.text.trim());
      });
      if (hasContent) {
        message = lexicalToHtml(stateJson as unknown as Record<string, unknown>);
      }
    }

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, service, message }),
      });
      const data: BookResult = await res.json();
      if (data.errors && data.errors.length > 0) {
        setErrors(data.errors);
      } else {
        setResult(data);
      }
    } catch {
      setErrors(['Something went wrong. Please try again or reach us directly at ' + business.phone + '.']);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-card-border bg-card p-10 text-center">
        <span className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-growth/10 text-growth">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h3 className="text-h3 font-semibold text-foreground">Request received</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Your reference is <span className="font-semibold text-foreground">{result.reference}</span>. A member of the team
          will reach out to confirm. Want to get started right away?
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={result.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-btn bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" /> Send via WhatsApp
          </a>
          <a
            href={result.mailto}
            className="inline-flex items-center gap-2 rounded-btn border border-card-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-brand/50 hover:text-brand"
          >
            <Mail className="h-4 w-4" /> Send via Email
          </a>
        </div>
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setName('');
            setContact('');
            setService('');
            setEditorState(null);
          }}
          className="mt-6 text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-brand hover:underline"
        >
          Submit another enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-card-border bg-card p-6 shadow-card sm:p-8 lg:p-10"
    >
      <h3 className="text-h3 font-semibold text-foreground">How can we help?</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Tell us a little about your situation. Everything you share is confidential.
      </p>

      <div className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Full name <span className="text-brand">*</span>
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Wanjiru"
              className="h-12 w-full rounded-btn border border-card-border bg-background px-4 text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Phone or email <span className="text-brand">*</span>
            </span>
            <input
              type="text"
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="+254 7XX XXX XXX"
              className="h-12 w-full rounded-btn border border-card-border bg-background px-4 text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Topic <span className="text-brand">*</span>
          </span>
          <SearchableSelect
            value={service}
            onValueChange={setService}
            options={serviceOptions}
            placeholder="Select a topic…"
            searchPlaceholder="Search topics…"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Your situation</span>
          <RichTextEditor
            onChange={handleEditorChange}
            placeholder="A few lines about your situation (optional) — strictly confidential."
          />
        </label>

        {errors.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <ul className="list-disc space-y-1 pl-4 text-sm text-red-600">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? 'Sending…' : 'Send Enquiry'}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-growth" />
          Strictly confidential. Never shared.
        </p>
      </div>
    </form>
  );
}

const infoCards = [
  {
    icon: Phone,
    title: 'Call or WhatsApp',
    lines: [business.phone, business.phoneAlt],
    href: `tel:${business.phone.replace(/\s/g, '')}`,
  },
  {
    icon: Mail,
    title: 'Email',
    lines: ['We reply within one business day'],
    obfuscatedEmail: business.email,
  },
  {
    icon: MapPin,
    title: 'Location',
    lines: ['Nairobi, Kenya', 'Serving clients nationwide & beyond'],
  },
  {
    icon: Clock,
    title: 'Working Hours',
    lines: ['Mon – Fri · 8:00 AM – 5:00 PM', 'Sat · By appointment'],
  },
];

export function ContactInfoNew() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {infoCards.map((card) => {
        const Icon = card.icon;
        const inner = (
          <div className="group h-full rounded-lg border border-card-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
              <Icon className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <h3 className="font-semibold text-foreground">{card.title}</h3>
            {'obfuscatedEmail' in card && card.obfuscatedEmail && (
              <ObfuscatedEmail
                email={card.obfuscatedEmail}
                className="mt-1 block text-sm leading-relaxed text-muted-foreground transition-colors hover:text-brand"
              >
                {card.obfuscatedEmail}
              </ObfuscatedEmail>
            )}
            {card.lines.map((line) => (
              <p key={line} className="mt-1 text-sm leading-relaxed text-muted-foreground">{line}</p>
            ))}
          </div>
        );
        return card.href ? (
          <a key={card.title} href={card.href} className="h-full">{inner}</a>
        ) : (
          <div key={card.title} className="h-full">{inner}</div>
        );
      })}
    </div>
  );
}

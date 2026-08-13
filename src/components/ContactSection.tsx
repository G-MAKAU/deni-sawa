'use client';

import React, { useState } from 'react';
import {
  Send, Loader2, CheckCircle2, MessageCircle, Mail, MapPin, Phone, Clock, ShieldCheck,
} from 'lucide-react';
import { services, business } from '@/data/content';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Textarea } from '@/components/ui/textarea';

const serviceOptions = [
  ...new Set([
    ...services.map((s) => s.title),
    'Starter Package (12 weeks)',
    'Standard Package (24 weeks)',
    'Solid Package (48 weeks)',
    'General Enquiry',
  ]),
];

interface BookingResult {
  ok: boolean;
  stored: boolean;
  reference: string;
  whatsapp: string;
  mailto: string;
  errors?: string[];
}

export function ContactForm() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [service, setService] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<BookingResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);
    setResult(null);

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, service, preferredDate, preferredTime, message }),
      });
      const data: BookingResult = await res.json();

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

  return (
    <form onSubmit={handleSubmit} className="rounded-4xl border border-border bg-card p-8 shadow-soft sm:p-10">
      <div className="mb-8">
        <h3 className="mb-2 font-heading text-2xl font-extrabold text-foreground">Book a free consultation</h3>
        <p className="text-sm text-muted-foreground">
          Tell us a little about yourself and a member of the Deni Sawa team will reach out to confirm your session.
        </p>
      </div>

      {result ? (
        <div className="rounded-3xl border border-green/25 bg-green/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green/15 text-green">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h4 className="mb-2 font-heading text-xl font-extrabold text-foreground">Request received!</h4>
          <p className="mb-1 text-sm text-muted-foreground">
            Your reference is <span className="font-bold text-foreground">{result.reference}</span>.
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            We will contact you shortly to confirm. Want to get the ball rolling right away?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={result.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" /> Send via WhatsApp
            </a>
            <a
              href={result.mailto}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-brand/50 hover:text-brand"
            >
              <Mail className="h-4 w-4" /> Send via Email
            </a>
          </div>
          <button
            type="button"
            onClick={() => { setResult(null); setName(''); setContact(''); setService(''); setPreferredDate(''); setPreferredTime(''); setMessage(''); }}
            className="mt-6 text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-brand hover:underline"
          >
            Book another consultation
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Full Name <span className="text-brand">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Wanjiru"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="contact" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Phone or Email <span className="text-brand">*</span>
              </label>
              <input
                id="contact"
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+254 7XX XXX XXX or you@email.com"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="service" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Service or Programme <span className="text-brand">*</span>
            </label>
            <select
              id="service"
              required
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-brand focus:outline-none"
            >
              <option value="" disabled>Select a service...</option>
              {serviceOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="preferredDate" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Preferred Date
              </label>
              <DatePicker value={preferredDate} onSelect={setPreferredDate} placeholder="Pick a preferred date" className="h-12 rounded-xl" />
            </div>
            <div>
              <label htmlFor="preferredTime" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Preferred Time
              </label>
              <TimePicker value={preferredTime} onChange={setPreferredTime} className="h-12 rounded-xl" />
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="message" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Your Message
            </label>
            <Textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us a little about your situation (optional) — everything is strictly confidential."
              className="resize-none rounded-xl border-input bg-background text-sm focus:border-brand"
            />
          </div>

          {errors.length > 0 && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <ul className="list-disc space-y-1 pl-4 text-xs text-red-600 dark:text-red-400">
                {errors.map((err) => <li key={err}>{err}</li>)}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-brand mt-7 w-full text-sm"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? 'Sending request...' : 'Request Free Consultation'}
          </button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-green" />
            Your information is strictly confidential and never shared.
          </p>
        </>
      )}
    </form>
  );
}

export function ContactInfoCards() {
  const cards = [
    {
      icon: Phone,
      title: 'Call or WhatsApp',
      lines: [business.phone, business.phoneAlt],
      href: `tel:${business.phone.replace(/\s/g, '')}`,
    },
    {
      icon: Mail,
      title: 'Email Us',
      lines: [business.email, 'We reply within one business day'],
      href: `mailto:${business.email}`,
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

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon;
        const inner = (
          <div className="group h-full rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
              <Icon className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <h3 className="mb-2 font-heading text-base font-bold text-foreground">{card.title}</h3>
            {card.lines.map((line) => (
              <p key={line} className="text-sm leading-relaxed text-muted-foreground">{line}</p>
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
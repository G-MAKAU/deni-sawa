import { NextRequest } from 'next/server';
import { business } from '@/data/content';

interface BookRequest {
  name?: string;
  contact?: string;
  service?: string;
  preferredDate?: string;
  preferredTime?: string;
  message?: string;
}

const MAX_LEN = { name: 100, contact: 200, service: 200, preferredDate: 20, preferredTime: 20, message: 2000 };

function clean(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isPhone(v: string): boolean {
  return /^\+?[0-9][0-9\s()-]{6,19}$/.test(v);
}

function makeReference(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DS-${ymd}-${rand}`;
}

export async function POST(req: NextRequest) {
  let body: BookRequest = {};
  try {
    body = await req.json();
  } catch {
    // leave body empty — validation below will return the errors
  }

  const name = clean(body.name, MAX_LEN.name);
  const contact = clean(body.contact, MAX_LEN.contact);
  const service = clean(body.service, MAX_LEN.service);
  const preferredDate = clean(body.preferredDate, MAX_LEN.preferredDate);
  const preferredTime = clean(body.preferredTime, MAX_LEN.preferredTime);
  const message = clean(body.message, MAX_LEN.message);

  const errors: string[] = [];
  if (!name) errors.push('Please provide your full name.');
  if (!contact) {
    errors.push('Please provide a phone number or email.');
  } else if (!isEmail(contact) && !isPhone(contact)) {
    errors.push('Please provide a valid email or phone number.');
  }
  if (!service) errors.push('Please select a service or programme.');
  if (errors.length > 0) {
    return Response.json({ ok: false, errors }, { status: 200 });
  }

  const reference = makeReference();
  const row = {
    reference,
    name,
    contact,
    contact_type: isEmail(contact) ? 'email' : 'phone',
    service,
    preferred_date: preferredDate || null,
    preferred_time: preferredTime || null,
    message: message || null,
    source: 'website-chat',
    status: 'new',
    created_at: new Date().toISOString(),
  };

  // Best-effort persistence — works the moment the consultation_bookings table exists.
  // If it doesn't (or Supabase is unreachable), we still return a receipt + hand-off links.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let stored = false;
  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/consultation_bookings`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(row),
      });
      stored = res.ok;
    } catch {
      stored = false;
    }
  }

  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || business.phone).replace(/\D/g, '');
  const summaryLines = [
    `New consultation booking (${reference})`,
    `Name: ${name}`,
    `Contact: ${contact}`,
    `Service: ${service}`,
    preferredDate ? `Preferred date: ${preferredDate}` : null,
    preferredTime ? `Preferred time: ${preferredTime}` : null,
    message ? `Message: ${message}` : null,
  ].filter(Boolean);
  const summary = summaryLines.join('\n');

  const whatsapp = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(summary)}`;
  const mailto = `mailto:${business.email}?subject=${encodeURIComponent(`Consultation booking ${reference}`)}&body=${encodeURIComponent(summary)}`;

  return Response.json(
    { ok: true, stored, reference, whatsapp, mailto, summary },
    { status: 200 }
  );
}

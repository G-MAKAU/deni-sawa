import { NextRequest } from 'next/server';
import { business } from '@/data/content';
import { site } from '@/data/site';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';

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

/** Send notification email to advisory@denisawa.co.ke with booking details. */
function notifyAdmin(ref: string, name: string, contact: string, service: string, message: string, preferredDate: string, preferredTime: string) {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? site.email;
  const rows = [
    `<tr><td style="padding:10px 14px;border:1px solid #E5E5E5;font-weight:600;width:130px;background:#F9F7F5;">Reference</td><td style="padding:10px 14px;border:1px solid #E5E5E5;">${ref}</td></tr>`,
    `<tr><td style="padding:10px 14px;border:1px solid #E5E5E5;font-weight:600;background:#F9F7F5;">Name</td><td style="padding:10px 14px;border:1px solid #E5E5E5;">${name}</td></tr>`,
    `<tr><td style="padding:10px 14px;border:1px solid #E5E5E5;font-weight:600;background:#F9F7F5;">Contact</td><td style="padding:10px 14px;border:1px solid #E5E5E5;">${contact}</td></tr>`,
    `<tr><td style="padding:10px 14px;border:1px solid #E5E5E5;font-weight:600;background:#F9F7F5;">Service</td><td style="padding:10px 14px;border:1px solid #E5E5E5;">${service}</td></tr>`,
  ];
  if (preferredDate) rows.push(`<tr><td style="padding:10px 14px;border:1px solid #E5E5E5;font-weight:600;background:#F9F7F5;">Preferred Date</td><td style="padding:10px 14px;border:1px solid #E5E5E5;">${preferredDate}</td></tr>`);
  if (preferredTime) rows.push(`<tr><td style="padding:10px 14px;border:1px solid #E5E5E5;font-weight:600;background:#F9F7F5;">Preferred Time</td><td style="padding:10px 14px;border:1px solid #E5E5E5;">${preferredTime}</td></tr>`);
  if (message) rows.push(`<tr><td style="padding:10px 14px;border:1px solid #E5E5E5;font-weight:600;background:#F9F7F5;">Message</td><td style="padding:10px 14px;border:1px solid #E5E5E5;">${message}</td></tr>`);

  const body = `
    <h1 style="margin:0 0 8px;">New Enquiry Received</h1>
    <p style="margin:0 0 20px;color:#6B7280;">A new consultation booking was submitted via the website contact form.</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;font-size:14px;">
      <tbody>${rows.join('')}</tbody>
    </table>
    <p style="margin:0;"><a href="${site.url}/admin/health-checks" style="display:inline-block;background:#E8510A;color:#FFFFFF !important;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:12px 24px;border-radius:6px;">View in Admin</a></p>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[Enquiry] ${name} — ${service} (${ref})`,
    html: buildBrandedEmailHtml(body, `New enquiry from ${name}: ${service}`),
  });
}

/** Send an elegant thank-you email to the user. */
function sendThankYou(userEmail: string, name: string, ref: string, service: string) {
  const firstName = name.split(' ')[0];
  const body = `
    <div style="text-align:center;margin:0 0 28px;">
      <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#E8510A,#C44508);line-height:56px;margin:0 auto 16px;">
        <span style="font-size:24px;color:#FFFFFF;">&#10003;</span>
      </div>
    </div>

    <h1 style="margin:0 0 12px;text-align:center;">Thank You, ${firstName}</h1>
    <p style="margin:0 0 20px;text-align:center;color:#6B7280;font-size:14px;">We have received your enquiry and will be in touch shortly.</p>

    <div style="background:#F9F7F5;border-radius:8px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 6px;font-size:13px;color:#8A857F;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Your Reference</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#1A1A1A;font-family:Georgia,serif;">${ref}</p>
    </div>

    <div style="background:#F9F7F5;border-radius:8px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 6px;font-size:13px;color:#8A857F;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Service</p>
      <p style="margin:0;font-size:15px;color:#1A1A1A;">${service}</p>
    </div>

    <div class="ds-divider" style="height:1px;background:#E5E5E5;margin:24px 0;"></div>

    <h2 style="margin:0 0 12px;font-size:17px;">What happens next?</h2>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
      <tr>
        <td style="padding:12px 0;vertical-align:top;width:36px;">
          <div style="width:28px;height:28px;border-radius:50%;background:#FEF0E5;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#E8510A;">1</div>
        </td>
        <td style="padding:12px 0;vertical-align:top;">
          <p style="margin:0 0 2px;font-weight:600;color:#1A1A1A;">We review your enquiry</p>
          <p style="margin:0;font-size:13px;color:#6B7280;">Our team will review the details you shared within one business day.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;vertical-align:top;">
          <div style="width:28px;height:28px;border-radius:50%;background:#FEF0E5;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#E8510A;">2</div>
        </td>
        <td style="padding:12px 0;vertical-align:top;">
          <p style="margin:0 0 2px;font-weight:600;color:#1A1A1A;">A senior advisor reaches out</p>
          <p style="margin:0;font-size:13px;color:#6B7280;">We will contact you to discuss your needs and schedule a consultation.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;vertical-align:top;">
          <div style="width:28px;height:28px;border-radius:50%;background:#FEF0E5;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#E8510A;">3</div>
        </td>
        <td style="padding:12px 0;vertical-align:top;">
          <p style="margin:0 0 2px;font-weight:600;color:#1A1A1A;">We get to work</p>
          <p style="margin:0;font-size:13px;color:#6B7280;">Together we chart a path from where you are to where you want to be.</p>
        </td>
      </tr>
    </table>

    <div style="background:#FDF3EC;border-radius:8px;padding:20px 24px;margin:0 0 24px;border-left:3px solid #E8510A;">
      <p style="margin:0;font-size:14px;color:#1A1A1A;line-height:1.6;">
        <strong>Need an immediate response?</strong><br/>
        Reach us directly at <a href="mailto:${site.email}" style="color:#E8510A;">${site.email}</a> or <a href="tel:${site.phone.replace(/\s/g, '')}" style="color:#E8510A;">${site.phone}</a>, or reply to this email.
      </p>
    </div>

    <div style="text-align:center;margin:28px 0 0;">
      <a href="${site.url}" style="display:inline-block;background:#E8510A;color:#FFFFFF !important;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:13px 28px;border-radius:6px;">Visit Our Website</a>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    toName: name,
    subject: `Thank you for contacting Deni Sawa Partners — ${ref}`,
    html: buildBrandedEmailHtml(body, `Thank you ${firstName}, we received your enquiry and will be in touch shortly.`),
  });
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
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
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

  // Fire-and-forget emails — never block the response.
  notifyAdmin(reference, name, contact, service, message, preferredDate, preferredTime).catch(() => {});
  if (isEmail(contact)) {
    sendThankYou(contact, name, reference, service).catch(() => {});
  }

  return Response.json(
    { ok: true, stored, reference, whatsapp, mailto, summary },
    { status: 200 }
  );
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/supabase/service';
import { sendTemplatedEmail, type EmailTemplateRow } from '@/lib/email';
import { sendTemplatedWhatsApp, type WhatsAppTemplateRow } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

const startSchema = z.object({
  health_check_id: z.string().uuid(),
  full_name: z.string().trim().min(1).max(200),
  business_name: z.string().trim().max(200).optional(),
  email: z.string().email().trim().optional().or(z.literal('')),
  whatsapp: z.string().trim().max(40).optional().or(z.literal('')),
  preferred_delivery: z.enum(['email', 'whatsapp', 'both']).optional(),
  report_selection: z.enum(['summary', 'detailed', 'detailed_call']).optional(),
  terms_agreed: z.literal(true, {
    message: 'You must agree to the Privacy Policy and Terms of Use',
  }),
  comms_consent: z.literal(true, {
    message: 'You must consent to receive your report',
  }),
});

function parseIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const candidate = (forwarded?.split(',')[0] ?? request.headers.get('x-real-ip') ?? '').trim();
  return candidate || null;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    // Consent is mandatory — surface the specific missing consent as a 400 so
    // the client can highlight the checkbox. A session is never created without it.
    const details = parsed.error.flatten();
    const termsError = details.fieldErrors.terms_agreed?.[0];
    const commsError = details.fieldErrors.comms_consent?.[0];
    if (termsError || commsError) {
      return NextResponse.json({ error: termsError ?? commsError }, { status: 400 });
    }
    return NextResponse.json({ error: 'Validation failed', details }, { status: 422 });
  }

  try {
    const supabase = getServiceClient();
    const { data: check, error: checkError } = await supabase
      .from('health_checks')
      .select('id, slug, name, detailed_price, detailed_call_price')
      .eq('id', parsed.data.health_check_id)
      .eq('is_active', true)
      .maybeSingle();

    if (checkError) throw checkError;
    if (!check) return NextResponse.json({ error: 'Health check not found or inactive.' }, { status: 404 });

    const email = parsed.data.email?.trim() || null;
    const whatsapp = parsed.data.whatsapp?.trim() || null;
    const reportSelection = parsed.data.report_selection ?? 'summary';

    // business_name required for the Business Health Check.
    if (check.slug === 'business-health-check' && !parsed.data.business_name?.trim()) {
      return NextResponse.json({ error: 'Business name is required for the Business Health Check.' }, { status: 422 });
    }

    if (!email && !whatsapp) {
      return NextResponse.json({ error: 'Provide at least an email or WhatsApp number.' }, { status: 422 });
    }

    // The Detailed + Advisory Call option must have a WhatsApp number.
    if (reportSelection === 'detailed_call' && !whatsapp) {
      return NextResponse.json(
        { error: 'A WhatsApp number is required for the Detailed + Advisory Call option so we can schedule your call.' },
        { status: 422 }
      );
    }

    const detailedPrice = Number(check.detailed_price ?? 0);
    const detailedCallPrice = Number(check.detailed_call_price ?? 0);
    const amount = reportSelection === 'detailed_call' ? detailedCallPrice : reportSelection === 'detailed' ? detailedPrice : 0;
    const requiresPayment = reportSelection === 'detailed' || reportSelection === 'detailed_call';

    // preferred_delivery must be consistent with what was provided.
    let preferredDelivery = parsed.data.preferred_delivery ?? 'email';
    if (email && !whatsapp) preferredDelivery = 'email';
    else if (!email && whatsapp) preferredDelivery = 'whatsapp';

    // Rate limiting (IP, email, whatsapp) — monthly caps.
    const ipAddress = parseIp(request);
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      p_health_check_id: parsed.data.health_check_id,
      p_ip: ipAddress,
      p_email: email,
      p_whatsapp: whatsapp,
    });

    if (allowed === false) {
      return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });
    }

    const { data: session, error: sessionError } = await supabase
      .from('health_check_sessions')
      .insert({
        health_check_id: check.id,
        full_name: parsed.data.full_name,
        business_name: parsed.data.business_name?.trim() || null,
        email,
        whatsapp,
        preferred_delivery: preferredDelivery,
        report_selection: reportSelection,
        requires_call: reportSelection === 'detailed_call',
        payment_amount: requiresPayment ? amount : null,
        payment_status: requiresPayment ? 'pending' : 'none',
        ip_address: ipAddress,
        user_agent: request.headers.get('user-agent'),
        terms_agreed: true,
        terms_agreed_at: new Date().toISOString(),
        terms_version: process.env.TERMS_VERSION ?? '2026-08',
        comms_consent: true,
        comms_consent_at: new Date().toISOString(),
        consent_ip: ipAddress,
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // ── Started notifications (best-effort) ─────────────────────────────────
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://deni-sawa.vercel.app';
    const resumeUrl = `${siteUrl}/business-health-checks/assessment/${check.slug}?session=${session.id}`;

    if (preferredDelivery === 'email' || preferredDelivery === 'both') {
      if (email) {
        try {
          const { data: template } = await supabase
            .from('email_templates')
            .select('*')
            .eq('template_key', 'health_check_started')
            .maybeSingle();
          if (template?.is_active) {
            await sendTemplatedEmail(supabase, {
              template: template as unknown as EmailTemplateRow,
              to: email,
              toName: parsed.data.full_name,
              variables: { recipient_name: parsed.data.full_name, check_name: check.name, resume_url: resumeUrl },
              sessionId: session.id,
            });
          }
        } catch (error) {
          console.error('Started email failed:', error);
        }
      }
    }

    if (preferredDelivery === 'whatsapp' || preferredDelivery === 'both') {
      if (whatsapp) {
        try {
          const { data: waTemplate } = await supabase
            .from('whatsapp_templates')
            .select('*')
            .eq('template_key', 'health_check_started')
            .maybeSingle();
          if (waTemplate?.is_active) {
            await sendTemplatedWhatsApp(supabase, {
              template: waTemplate as unknown as WhatsAppTemplateRow,
              to: whatsapp,
              toName: parsed.data.full_name,
              variables: { recipient_name: parsed.data.full_name, check_name: check.name, resume_url: resumeUrl },
              sessionId: session.id,
            });
          }
        } catch (error) {
          console.error('Started WhatsApp message failed:', error);
        }
      }
    }

    return NextResponse.json({
      session_id: session.id,
      health_check_id: check.id,
      slug: check.slug,
      name: check.name,
      resume_url: resumeUrl,
      report_selection: reportSelection,
      requires_payment: requiresPayment,
      amount: amount,
    });
  } catch (error) {
    console.error('Failed to start health check:', error);
    return NextResponse.json({ error: 'Failed to start health check.' }, { status: 500 });
  }
}

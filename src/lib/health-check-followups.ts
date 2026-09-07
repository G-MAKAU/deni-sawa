import { getServiceClient } from '@/lib/supabase/service';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';
import { site } from '@/data/site';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.denisawa.co.ke';

interface IncompleteSession {
  id: string;
  full_name: string;
  business_name: string | null;
  email: string;
  started_at: string;
  health_check_id: string;
  health_checks: { slug: string } | null;
}

interface FollowupRecord {
  session_id: string;
  email_number: number;
}

/** Days after session start when each follow-up email fires. */
const FOLLOWUP_DAYS = [2, 4, 6, 7] as const;

/** After this many days, incomplete sessions are deleted. */
const CLEANUP_DAYS = 8;

// ─── Email content per stage ────────────────────────────────────────────────

function followupEmail(
  name: string,
  businessName: string | null,
  resumeUrl: string,
  emailNumber: number,
): { subject: string; html: string } {
  const greeting = businessName
    ? `Hi ${name}, we noticed you started a Business Health Check for ${businessName} but haven't finished it yet.`
    : `Hi ${name}, we noticed you started a Business Health Check but haven't finished it yet.`;

  const stages: Record<number, { subject: string; heading: string; body: string; preview: string }> = {
    1: {
      subject: 'Complete your Business Health Check',
      heading: 'Your assessment is waiting',
      body: `<p>${greeting}</p>
<p>Your answers are saved — just pick up where you left off. It only takes a few minutes to complete.</p>`,
      preview: 'Your Business Health Check is waiting for you to finish.',
    },
    2: {
      subject: 'Your Business Health Check is still open',
      heading: 'Still interested?',
      body: `<p>${greeting}</p>
<p>We kept your progress saved. Completing the assessment gives you a clear picture of your business health and actionable next steps.</p>`,
      preview: 'Your Business Health Check answers are still saved.',
    },
    3: {
      subject: '2 days left to complete your assessment',
      heading: 'Your assessment expires soon',
      body: `<p>${greeting}</p>
<p>This is a reminder that your incomplete assessment will be automatically deleted in 2 days. Your saved answers and progress will be lost.</p>`,
      preview: 'Your assessment will be deleted in 2 days.',
    },
    4: {
      subject: 'Last chance — your assessment expires today',
      heading: 'Final reminder',
      body: `<p>${greeting}</p>
<p>Your incomplete assessment is scheduled for deletion today. If you'd like to keep your progress and receive your report, complete it now.</p>`,
      preview: 'Your assessment expires today.',
    },
  };

  const stage = stages[emailNumber];
  const unsubscribeNote = `<p style="font-size:12px;color:#9CA3AF;margin-top:24px;">If you no longer wish to receive these reminders, you can ignore this email — your session will be automatically cleaned up after 8 days.</p>`;

  const html = buildBrandedEmailHtml(`
    <h1>${stage.heading}</h1>
    ${stage.body}
    <p style="margin-top:20px;">
      <a href="${resumeUrl}" class="ds-button">Continue Your Assessment</a>
    </p>
    <div class="ds-divider" />
    <p style="font-size:13px;color:#6B7280;">Or copy this link: <a href="${resumeUrl}" style="color:#E8510A;">${resumeUrl}</a></p>
    ${unsubscribeNote}
  `, stage.preview);

  return { subject: stage.subject, html };
}

// ─── Send follow-up emails ──────────────────────────────────────────────────

async function sendFollowups(
  supabase: ReturnType<typeof getServiceClient>,
): Promise<{ sent: number; skipped: number }> {
  let sent = 0;
  let skipped = 0;

  for (let i = 0; i < FOLLOWUP_DAYS.length; i++) {
    const emailNumber = i + 1;
    const days = FOLLOWUP_DAYS[i];

    // Find sessions started exactly `days` days ago (within a 25h window)
    // that have an email, are not complete, have comms consent,
    // and don't already have this follow-up number.
    const lowerBound = new Date(Date.now() - (days * 24 + 12) * 60 * 60 * 1000).toISOString();
    const upperBound = new Date(Date.now() - (days * 24 - 1) * 60 * 60 * 1000).toISOString();

    const { data: sessions, error: fetchErr } = await supabase
      .from('health_check_sessions')
      .select('id, full_name, business_name, email, started_at, health_check_id, health_checks!inner(slug)')
      .eq('is_complete', false)
      .not('email', 'is', null)
      .eq('comms_consent', true)
      .gte('started_at', lowerBound)
      .lte('started_at', upperBound)
      .returns<IncompleteSession[]>();

    if (fetchErr) {
      console.error(`Follow-up fetch error (email ${emailNumber}):`, fetchErr);
      continue;
    }
    if (!sessions || sessions.length === 0) continue;

    // Exclude sessions that already received this email number
    const sessionIds = sessions.map((s) => s.id);
    const { data: existing } = await supabase
      .from('health_check_followups')
      .select('session_id, email_number')
      .in('session_id', sessionIds)
      .eq('email_number', emailNumber)
      .returns<FollowupRecord[]>();

    const sentSet = new Set(existing?.map((r) => r.session_id) ?? []);

    for (const session of sessions) {
      if (sentSet.has(session.id)) {
        skipped++;
        continue;
      }

      const slug = session.health_checks?.slug ?? 'business-health-check';
      const resumeUrl = `${SITE_URL}/business-health-checks/assessment/${slug}?session=${session.id}`;
      const { subject, html } = followupEmail(
        session.full_name,
        session.business_name,
        resumeUrl,
        emailNumber,
      );

      const result = await sendEmail({
        to: session.email,
        toName: session.full_name,
        subject,
        html,
        sessionId: session.id,
      });

      if (result.ok) {
        await supabase.from('health_check_followups').insert({
          session_id: session.id,
          email_number: emailNumber,
        });
        sent++;
      } else {
        console.error(`Follow-up email ${emailNumber} failed for session ${session.id}:`, result.error);
      }
    }
  }

  return { sent, skipped };
}

// ─── Delete expired incomplete sessions ─────────────────────────────────────

async function cleanupExpiredSessions(
  supabase: ReturnType<typeof getServiceClient>,
): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Only delete sessions that:
  // 1. Are incomplete
  // 2. Were started more than CLEANUP_DAYS ago
  // 3. Have NOT paid (payment_status != 'paid')
  const { data: expired, error: fetchErr } = await supabase
    .from('health_check_sessions')
    .select('id')
    .eq('is_complete', false)
    .not('payment_status', 'eq', 'paid')
    .lt('started_at', cutoff)
    .returns<{ id: string }[]>();

  if (fetchErr) {
    console.error('Cleanup fetch error:', fetchErr);
    return { deleted: 0 };
  }
  if (!expired || expired.length === 0) return { deleted: 0 };

  const ids = expired.map((s) => s.id);

  // Delete followups first (explicit, though CASCADE handles it)
  await supabase.from('health_check_followups').delete().in('session_id', ids);

  // Delete answers
  await supabase.from('health_check_answers').delete().in('session_id', ids);

  // Delete sessions (CASCADE deletes reports too)
  const { error: delErr } = await supabase
    .from('health_check_sessions')
    .delete()
    .in('id', ids);

  if (delErr) {
    console.error('Cleanup delete error:', delErr);
    return { deleted: 0 };
  }

  return { deleted: ids.length };
}

// ─── Main entry point ───────────────────────────────────────────────────────

export async function runHealthCheckFollowups(): Promise<{
  sent: number;
  skipped: number;
  deleted: number;
}> {
  const supabase = getServiceClient();
  const { sent, skipped } = await sendFollowups(supabase);
  const { deleted } = await cleanupExpiredSessions(supabase);
  return { sent, skipped, deleted };
}

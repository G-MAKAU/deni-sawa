'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Mail, MessageCircle, Server } from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import { AdminCard, EmptyState, ErrorBanner, Loading, PageHeader, StatusPill } from '@/components/admin/ui';

interface EmailTemplateSummary {
  template_key: string;
  name: string;
  subject: string;
  is_active: boolean;
  updated_at: string;
}

interface WhatsAppTemplateSummary {
  template_key: string;
  name: string;
  approval_status: 'draft' | 'submitted' | 'approved' | 'rejected';
  is_active: boolean;
  rejection_reason: string | null;
  updated_at: string;
}

interface DeliveryData {
  check: { name: string; slug: string };
  emailTemplates: EmailTemplateSummary[];
  whatsappTemplates: WhatsAppTemplateSummary[];
  smtp: { configured: boolean; host: string | null; fromName: string; fromEmail: string };
  whatsapp: {
    configured: boolean;
    provider: string;
    is_active: boolean;
    from_number: string | null;
    encryption_key_configured: boolean;
  };
}

const EMAIL_KEYS = ['health_check_started', 'health_check_report_summary', 'health_check_report_detailed'];
const WHATSAPP_KEYS = ['health_check_started', 'health_check_report_summary', 'health_check_report_detailed'];

export function DeliveryClient() {
  const params = useParams<{ id: string }>();
  const checkId = params.id;

  const [data, setData] = React.useState<DeliveryData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await adminFetch<DeliveryData>(`/api/admin/health-checks/${checkId}/delivery`);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load delivery configuration.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkId]);

  if (error) return <ErrorBanner message={error} />;
  if (loading) return <Loading label="Loading delivery configuration…" />;
  if (!data) return null;

  const emailByKey = new Map(data.emailTemplates.map((t) => [t.template_key, t]));
  const waByKey = new Map(data.whatsappTemplates.map((t) => [t.template_key, t]));

  return (
    <>
      <PageHeader
        title="Delivery Configuration"
        subtitle={`How reports for "${data.check.name}" reach visitors.`}
        crumbs={[{ label: 'Health Checks', href: '/admin/health-checks' }, { label: 'Delivery' }]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard
          title="Email templates"
          subtitle="Delivered via domain SMTP"
          actions={
            <Link href="/admin/email" className="text-xs font-semibold text-[#E8510A] hover:underline">
              Edit templates →
            </Link>
          }
          bodyClassName="p-0"
        >
          <div className="divide-y divide-[var(--a-border-soft)]">
            {EMAIL_KEYS.map((key) => {
              const template = emailByKey.get(key);
              return (
                <div key={key} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#E8510A]/10 text-[#E8510A]">
                      <Mail className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <Link href={`/admin/email/${key}`} className="block truncate text-sm font-medium text-[var(--a-ink2)] hover:text-[#E8510A]">
                        {template?.name ?? key}
                      </Link>
                      <p className="truncate font-mono text-[11px] text-[var(--a-muted)]">{key}</p>
                    </div>
                  </div>
                  <StatusPill tone={template?.is_active ? 'green' : 'grey'}>{template?.is_active ? 'Active' : 'Inactive'}</StatusPill>
                </div>
              );
            })}
          </div>
        </AdminCard>

        <AdminCard
          title="WhatsApp templates"
          subtitle="Require provider approval before activation"
          actions={
            <Link href="/admin/whatsapp" className="text-xs font-semibold text-[#E8510A] hover:underline">
              Edit templates →
            </Link>
          }
          bodyClassName="p-0"
        >
          <div className="divide-y divide-[var(--a-border-soft)]">
            {WHATSAPP_KEYS.map((key) => {
              const template = waByKey.get(key);
              return (
                <div key={key} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#5A9E28]/10 text-[#5A9E28]">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <Link href={`/admin/whatsapp/${key}`} className="block truncate text-sm font-medium text-[var(--a-ink2)] hover:text-[#E8510A]">
                        {template?.name ?? key}
                      </Link>
                      <p className="truncate font-mono text-[11px] text-[var(--a-muted)]">{key}</p>
                    </div>
                  </div>
                  <StatusPill
                    tone={
                      template?.approval_status === 'approved'
                        ? 'green'
                        : template?.approval_status === 'submitted'
                          ? 'amber'
                          : template?.approval_status === 'rejected'
                            ? 'red'
                            : 'grey'
                    }
                  >
                    {template?.approval_status ?? 'draft'}
                  </StatusPill>
                </div>
              );
            })}
          </div>
        </AdminCard>

        <AdminCard title="SMTP" subtitle="Domain email server">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#E8510A]/10 text-[#E8510A]">
              <Server className="h-4 w-4" />
            </span>
            <div className="space-y-1 text-sm text-[var(--a-text2)]">
              <p>
                <span className="font-semibold text-[var(--a-ink2)]">Status:</span>{' '}
                <StatusPill tone={data.smtp.configured ? 'green' : 'red'}>{data.smtp.configured ? 'Configured' : 'Not configured'}</StatusPill>
              </p>
              <p>
                <span className="font-semibold text-[var(--a-ink2)]">Host:</span> {data.smtp.host ?? '—'}
              </p>
              <p>
                <span className="font-semibold text-[var(--a-ink2)]">From:</span> {data.smtp.fromName} &lt;{data.smtp.fromEmail}&gt;
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard
          title="WhatsApp provider"
          subtitle="Business API connection"
          actions={
            <Link href="/admin/whatsapp/config" className="text-xs font-semibold text-[#E8510A] hover:underline">
              Configure →
            </Link>
          }
        >
          <div className="space-y-2 text-sm text-[var(--a-text2)]">
            <p>
              <span className="font-semibold text-[var(--a-ink2)]">Status:</span>{' '}
              <StatusPill tone={data.whatsapp.configured && data.whatsapp.is_active ? 'green' : data.whatsapp.configured ? 'amber' : 'red'}>
                {data.whatsapp.configured && data.whatsapp.is_active ? 'Connected & active' : data.whatsapp.configured ? 'Configured but inactive' : 'Not configured'}
              </StatusPill>
            </p>
            <p>
              <span className="font-semibold text-[var(--a-ink2)]">Provider:</span> {data.whatsapp.provider}
            </p>
            <p>
              <span className="font-semibold text-[var(--a-ink2)]">From number:</span> {data.whatsapp.from_number ?? '—'}
            </p>
            <p>
              <span className="font-semibold text-[var(--a-ink2)]">Encryption key:</span>{' '}
              <StatusPill tone={data.whatsapp.encryption_key_configured ? 'green' : 'red'}>
                {data.whatsapp.encryption_key_configured ? 'Configured' : 'Missing'}
              </StatusPill>
            </p>
            {!data.whatsapp.encryption_key_configured && (
              <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                Set CREDENTIALS_ENCRYPTION_KEY before saving WhatsApp credentials.
              </p>
            )}
          </div>
        </AdminCard>
      </div>
    </>
  );
}

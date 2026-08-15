'use client';

import * as React from 'react';
import { Bot, Database, Globe, Lock, Mail, MessageCircle, Phone, Server } from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import { site } from '@/data/site';
import { socialLinks } from '@/components/SocialLinks';
import { cn } from '@/lib/utils';
import { AdminCard, ErrorBanner, Loading, PageHeader, StatusPill } from '@/components/admin/ui';

interface SettingsData {
  settings: {
    siteUrl: string;
    smtp: { configured: boolean; host: string | null; fromName: string; fromEmail: string };
    whatsapp: {
      provider: string;
      encryptionKeyConfigured: boolean;
      twilioConfigured: boolean;
      metaConfigured: boolean;
    };
    anthropic: { configured: boolean; model: string };
    supabase: { configured: boolean };
  };
}

export function SettingsClient() {
  const [data, setData] = React.useState<SettingsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await adminFetch<SettingsData>('/api/admin/settings');
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load settings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (loading) return <Loading label="Loading settings…" />;
  if (!data) return null;

  const { settings } = data;

  return (
    <>
      <PageHeader title="Settings" subtitle="Read-only overview of the environment configuration for this deployment." crumbs={[{ label: 'Settings' }]} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Site">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#E8510A]/10 text-[#E8510A]">
              <Globe className="h-4 w-4" />
            </span>
            <div className="space-y-1 text-sm text-[var(--a-text2)]">
              <p>
                <span className="font-semibold text-[var(--a-ink2)]">Site URL:</span> {settings.siteUrl}
              </p>
              <p>
                <span className="font-semibold text-[var(--a-ink2)]">Supabase:</span>{' '}
                <StatusPill tone={settings.supabase.configured ? 'green' : 'red'}>
                  {settings.supabase.configured ? 'Connected' : 'Not configured'}
                </StatusPill>
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard title="Contact & Socials" subtitle="The public-facing contact details and social channels.">
          <div className="space-y-2 text-sm text-[var(--a-text2)]">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-[#E8510A]" />
              <a href={`mailto:${site.email}`} className="hover:text-[#E8510A]">{site.email}</a>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-[#E8510A]" />
              <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="hover:text-[#E8510A]">{site.phone}</a>
            </p>
            <div className="h-px bg-[var(--a-border-soft)]" />
            <div className="flex flex-wrap gap-2">
              {socialLinks.map(({ name, href, icon: Icon, ariaLabel, hoverClass }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={ariaLabel}
                  title={name}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border border-[var(--a-border)] bg-[var(--a-subtle)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--a-text)] transition-colors',
                    hoverClass
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {name}
                </a>
              ))}
            </div>
          </div>
        </AdminCard>

        <AdminCard title="Email (SMTP)">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#E8510A]/10 text-[#E8510A]">
              <Mail className="h-4 w-4" />
            </span>
            <div className="space-y-1 text-sm text-[var(--a-text2)]">
              <p>
                <span className="font-semibold text-[var(--a-ink2)]">Status:</span>{' '}
                <StatusPill tone={settings.smtp.configured ? 'green' : 'red'}>{settings.smtp.configured ? 'Configured' : 'Not configured'}</StatusPill>
              </p>
              <p>
                <span className="font-semibold text-[var(--a-ink2)]">Host:</span> {settings.smtp.host ?? '—'}
              </p>
              <p>
                <span className="font-semibold text-[var(--a-ink2)]">From:</span> {settings.smtp.fromName} &lt;{settings.smtp.fromEmail}&gt;
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard title="WhatsApp">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#5A9E28]/10 text-[#5A9E28]">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div className="space-y-1 text-sm text-[var(--a-text2)]">
              <p>
                <span className="font-semibold text-[var(--a-ink2)]">Default provider:</span> {settings.whatsapp.provider}
              </p>
              <p>
                <span className="font-semibold text-[var(--a-ink2)]">Encryption key:</span>{' '}
                <StatusPill tone={settings.whatsapp.encryptionKeyConfigured ? 'green' : 'red'}>
                  {settings.whatsapp.encryptionKeyConfigured ? 'Configured' : 'Missing'}
                </StatusPill>
              </p>
              <p>
                <span className="font-semibold text-[var(--a-ink2)]">Twilio env:</span>{' '}
                <StatusPill tone={settings.whatsapp.twilioConfigured ? 'green' : 'grey'}>
                  {settings.whatsapp.twilioConfigured ? 'Configured' : 'Not set'}
                </StatusPill>
              </p>
              <p>
                <span className="font-semibold text-[var(--a-ink2)]">Meta env:</span>{' '}
                <StatusPill tone={settings.whatsapp.metaConfigured ? 'green' : 'grey'}>
                  {settings.whatsapp.metaConfigured ? 'Configured' : 'Not set'}
                </StatusPill>
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard title="AI (Anthropic)">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#E8510A]/10 text-[#E8510A]">
              <Bot className="h-4 w-4" />
            </span>
            <div className="space-y-1 text-sm text-[var(--a-text2)]">
              <p>
                <span className="font-semibold text-[var(--a-ink2)]">Status:</span>{' '}
                <StatusPill tone={settings.anthropic.configured ? 'green' : 'amber'}>
                  {settings.anthropic.configured ? 'Configured' : 'Not set — fallback reports are used'}
                </StatusPill>
              </p>
              <p>
                <span className="font-semibold text-[var(--a-ink2)]">Default model:</span> {settings.anthropic.model}
              </p>
            </div>
          </div>
        </AdminCard>

        <div className="flex items-center gap-2 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 py-3 text-xs text-[var(--a-muted)] lg:col-span-2">
          <Lock className="h-3.5 w-3.5 text-[#5A9E28]" />
          Secrets are never exposed here — only whether each service is configured.
        </div>
      </div>
    </>
  );
}

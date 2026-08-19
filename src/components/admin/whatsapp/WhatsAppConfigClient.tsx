'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { ClipboardCopy, Loader2, Lock, RefreshCw, Save, Zap } from 'lucide-react';
import { adminFetch, adminPut, adminPost } from '@/lib/admin-client';
import { AdminCard, AsyncButton, ErrorBanner, Field, Loading, PageHeader, Toggle } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

type Provider = 'twilio' | 'meta_cloud_api' | 'infobip';

interface WhatsAppConfigDetail {
  provider: Provider;
  phone_number_id: string | null;
  account_sid: string | null;
  from_number: string | null;
  is_active: boolean;
  webhook_verify_token: string | null;
  has_access_token: boolean;
  has_auth_token: boolean;
  access_token_masked: string | null;
  auth_token_masked: string | null;
}

const PROVIDERS: { value: Provider; label: string; description: string }[] = [
  { value: 'twilio', label: 'Twilio', description: 'Twilio WhatsApp Business API' },
  { value: 'meta_cloud_api', label: 'Meta Cloud API', description: 'WhatsApp Business Cloud API' },
  { value: 'infobip', label: 'Infobip', description: 'Infobip WhatsApp API' },
];

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20';

export function WhatsAppConfigClient() {
  const [config, setConfig] = React.useState<WhatsAppConfigDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [provider, setProvider] = React.useState<Provider>('twilio');
  const [accountSid, setAccountSid] = React.useState('');
  const [authToken, setAuthToken] = React.useState('');
  const [phoneNumberId, setPhoneNumberId] = React.useState('');
  const [accessToken, setAccessToken] = React.useState('');
  const [fromNumber, setFromNumber] = React.useState('');
  const [verifyToken, setVerifyToken] = React.useState('');
  const [isActive, setIsActive] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/whatsapp/webhook`;

  const generateToken = () => {
    const buf = new Uint8Array(18);
    crypto.getRandomValues(buf);
    const token = Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
    setVerifyToken(token);
  };

  const copyWebhook = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { config: row } = await adminFetch<{ config: WhatsAppConfigDetail | null }>('/api/admin/whatsapp-config');
        if (cancelled) return;
        if (row) {
          setConfig(row);
          setProvider(row.provider);
          setAccountSid(row.account_sid ?? '');
          setPhoneNumberId(row.phone_number_id ?? '');
          setFromNumber(row.from_number ?? '');
          setVerifyToken(row.webhook_verify_token ?? '');
          setIsActive(row.is_active);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load configuration.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { config: row } = await adminPut<{ config: WhatsAppConfigDetail }>('/api/admin/whatsapp-config', {
        provider,
        phone_number_id: phoneNumberId || null,
        access_token: accessToken || null,
        account_sid: accountSid || null,
        auth_token: authToken || null,
        from_number: fromNumber || null,
        webhook_verify_token: verifyToken || null,
        is_active: isActive,
      });
      setConfig(row);
      setAuthToken('');
      setAccessToken('');
      toast.success('WhatsApp configuration saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await adminPost('/api/admin/whatsapp-config/test', {});
      toast.success('Connection successful');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Connection test failed.');
    } finally {
      setTesting(false);
    }
  };

  if (error) return <ErrorBanner message={error} />;
  if (loading) return <Loading label="Loading WhatsApp configuration…" />;

  return (
    <>
      <PageHeader
        title="WhatsApp Configuration"
        subtitle="Connect a WhatsApp Business API provider for report delivery."
        crumbs={[{ label: 'WhatsApp Templates', href: '/admin/whatsapp' }, { label: 'Configuration' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !config}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border-2 border-[#5A9E28] px-3.5 text-[13px] font-bold text-[#3f7a1a] hover:bg-[#5A9E28]/10 disabled:opacity-50"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Test connection
            </button>
            <AsyncButton
              onClick={handleSave}
              loading={saving}
              loadingLabel="Saving…"
              label="Save configuration"
              icon={<Save className="h-4 w-4" />}
              size="sm"
            />
          </div>
        }
      />

      <div className="max-w-2xl space-y-6">
        <AdminCard title="Provider" subtitle="Choose which WhatsApp Business API you use.">
          <div className="grid gap-3 sm:grid-cols-3">
            {PROVIDERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setProvider(option.value)}
                className={cn(
                  'rounded-lg border px-4 py-3.5 text-left transition-colors',
                  provider === option.value ? 'border-[#E8510A] bg-[#E8510A]/5' : 'border-[var(--a-border)] hover:border-[#E8510A]/40'
                )}
              >
                <p className={cn('text-sm font-bold', provider === option.value ? 'text-[#c94508]' : 'text-[var(--a-ink2)]')}>{option.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-[var(--a-muted)]">{option.description}</p>
              </button>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="Credentials" subtitle="New values are encrypted with AES-256-GCM before storage. Leave blank to keep existing.">
          <div className="space-y-5">
            {provider === 'twilio' && (
              <>
                <Field label="Account SID">
                  <input className={INPUT_CLASS} value={accountSid} onChange={(e) => setAccountSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxx" />
                </Field>
                <Field label="Auth token" hint={config?.has_auth_token ? `Stored: ${config.auth_token_masked ?? '••••••••'}` : 'Not stored yet'}>
                  <input className={INPUT_CLASS} type="password" value={authToken} onChange={(e) => setAuthToken(e.target.value)} placeholder="Enter new auth token to replace" />
                </Field>
              </>
            )}

            {provider === 'meta_cloud_api' && (
              <>
                <Field label="Phone number ID">
                  <input className={INPUT_CLASS} value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="123456789012345" />
                </Field>
                <Field label="Access token" hint={config?.has_access_token ? `Stored: ${config.access_token_masked ?? '••••••••'}` : 'Not stored yet'}>
                  <input className={INPUT_CLASS} type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="Enter new token to replace" />
                </Field>
              </>
            )}

            {provider === 'infobip' && (
              <>
                <Field label="Base URL" hint="e.g. xyz.api.infobip.com">
                  <input className={INPUT_CLASS} value={accountSid} onChange={(e) => setAccountSid(e.target.value)} placeholder="xyz.api.infobip.com" />
                </Field>
                <Field label="API key" hint={config?.has_auth_token ? `Stored: ${config.auth_token_masked ?? '••••••••'}` : 'Not stored yet'}>
                  <input className={INPUT_CLASS} type="password" value={authToken} onChange={(e) => setAuthToken(e.target.value)} placeholder="Enter new API key to replace" />
                </Field>
              </>
            )}

            <Field label="From number" hint="For Twilio include the whatsapp: prefix, e.g. whatsapp:+14155238886">
              <input className={INPUT_CLASS} value={fromNumber} onChange={(e) => setFromNumber(e.target.value)} placeholder="whatsapp:+254700000000" />
            </Field>

            <div className="flex items-center justify-between rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--a-ink2)]">Provider active</p>
                <p className="text-xs text-[var(--a-muted)]">Enables WhatsApp delivery to visitors</p>
              </div>
              <Toggle checked={isActive} onChange={setIsActive} label="Provider active" />
            </div>
          </div>
        </AdminCard>

        <AdminCard
          title="Meta webhook"
          subtitle="Delivers message status (delivered/read) and template approval updates from the Meta Cloud API. Configure this in the Meta developer app."
          bodyClassName="p-4"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--a-muted)]">Webhook URL</p>
                <p className="mt-0.5 truncate font-mono text-[12px] text-[var(--a-ink2)]">{webhookUrl}</p>
              </div>
              <button
                type="button"
                onClick={() => copyWebhook(webhookUrl)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 py-2 text-[12px] font-semibold text-[var(--a-text)] hover:border-[#E8510A]/40 hover:text-[#E8510A]"
              >
                <ClipboardCopy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Verify token</label>
                <div className="flex gap-2">
                  <input
                    className={cn(INPUT_CLASS, 'font-mono')}
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    placeholder="Generate or paste a shared secret"
                  />
                  <button
                    type="button"
                    onClick={generateToken}
                    title="Generate a random token"
                    className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-[13px] font-semibold text-[var(--a-text)] hover:border-[#E8510A]/40 hover:text-[#E8510A]"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-[var(--a-muted)]">
                  Paste this into Meta&rsquo;s <span className="font-semibold">Verify Token</span> field when setting up the webhook. Save the
                  configuration after changing it.
                </p>
              </div>
            </div>
          </div>
        </AdminCard>

        <div className="flex items-center gap-2 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 py-3 text-xs text-[var(--a-muted)]">
          <Lock className="h-3.5 w-3.5 text-[#5A9E28]" />
          Credentials are encrypted with AES-256-GCM using the CREDENTIALS_ENCRYPTION_KEY before storage. They are never sent to the browser.
        </div>
      </div>
    </>
  );
}

'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { adminFetch, adminPut } from '@/lib/admin-client';
import { AdminCard, AsyncButton, ErrorBanner, Field, Loading, PageHeader, Toggle } from '@/components/admin/ui';

interface RateLimitConfig {
  health_check_id: string;
  monthly_limit_per_ip: number;
  monthly_limit_per_email: number;
  monthly_limit_per_whatsapp: number;
  is_active: boolean;
}

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 text-sm text-[var(--a-ink)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20';

export function RateLimitsClient() {
  const params = useParams<{ id: string }>();
  const checkId = params.id;

  const [config, setConfig] = React.useState<RateLimitConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [perIp, setPerIp] = React.useState('5');
  const [perEmail, setPerEmail] = React.useState('5');
  const [perWhatsapp, setPerWhatsapp] = React.useState('5');
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { config: row } = await adminFetch<{ config: RateLimitConfig }>(`/api/admin/health-checks/${checkId}/rate-limits`);
        if (cancelled) return;
        setConfig(row);
        setPerIp(row.monthly_limit_per_ip.toString());
        setPerEmail(row.monthly_limit_per_email.toString());
        setPerWhatsapp(row.monthly_limit_per_whatsapp.toString());
        setIsActive(row.is_active);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load rate limit config.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { config: row } = await adminPut<{ config: RateLimitConfig }>(`/api/admin/health-checks/${checkId}/rate-limits`, {
        monthly_limit_per_ip: Number(perIp),
        monthly_limit_per_email: Number(perEmail),
        monthly_limit_per_whatsapp: Number(perWhatsapp),
        is_active: isActive,
      });
      setConfig(row);
      toast.success('Rate limits saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save rate limits.');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorBanner message={error} />;
  if (loading) return <Loading label="Loading rate limits…" />;

  return (
    <>
      <PageHeader
        title="Rate Limits"
        subtitle="Monthly submission caps per visitor to prevent abuse."
        crumbs={[{ label: 'Health Checks', href: '/admin/health-checks' }, { label: 'Rate Limits' }]}
        actions={
          <AsyncButton
            onClick={handleSave}
            loading={saving}
            loadingLabel="Saving…"
            label="Save limits"
            icon={<Save className="h-4 w-4" />}
            size="sm"
          />
        }
      />

      <div className="max-w-2xl">
        <AdminCard title="Monthly limits" subtitle="A visitor is blocked once they exceed a limit within the current calendar month.">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Per IP address">
              <input className={INPUT_CLASS} type="number" min={0} value={perIp} onChange={(e) => setPerIp(e.target.value)} />
            </Field>
            <Field label="Per email">
              <input className={INPUT_CLASS} type="number" min={0} value={perEmail} onChange={(e) => setPerEmail(e.target.value)} />
            </Field>
            <Field label="Per WhatsApp">
              <input className={INPUT_CLASS} type="number" min={0} value={perWhatsapp} onChange={(e) => setPerWhatsapp(e.target.value)} />
            </Field>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--a-ink2)]">Rate limiting active</p>
              <p className="text-xs text-[var(--a-muted)]">When off, the default limits (5 per month) still apply</p>
            </div>
            <Toggle checked={isActive} onChange={setIsActive} label="Rate limiting active" />
          </div>
        </AdminCard>
      </div>
    </>
  );
}

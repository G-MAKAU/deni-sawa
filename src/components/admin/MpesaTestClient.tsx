'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminCard, AsyncButton, ErrorBanner, Field, PageHeader, StatusPill } from '@/components/admin/ui';

interface CredentialStatus {
  simulated: boolean;
  mpesa_env: string;
  has_consumer_key: boolean;
  has_consumer_secret: boolean;
  has_passkey: boolean;
  has_shortcode: boolean;
}

interface TestResult {
  ok: boolean;
  simulate?: boolean;
  checkout_request_id?: string;
  message?: string;
  error?: string;
  env?: CredentialStatus;
}

export function MpesaTestClient() {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [credStatus, setCredStatus] = useState<CredentialStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/payments/mpesa/test');
      if (!res.ok) throw new Error(`Status check failed (${res.status})`);
      const data: CredentialStatus = await res.json();
      setCredStatus(data);
      setStatusError(null);
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : 'Failed to check credentials');
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/payments/mpesa/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount: Number(amount) }),
      });
      const data: TestResult = await res.json();
      setResult(data);
      if (data.env) setCredStatus(data.env);
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : 'Request failed' });
    } finally {
      setLoading(false);
    }
  };

  const envColor = credStatus?.mpesa_env === 'production' ? 'red' : 'blue';

  return (
    <>
      <PageHeader
        title="M-Pesa Credential Test"
        subtitle="Send a test STK push to verify your Safaricom Daraja API credentials."
        crumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'M-Pesa Test' },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Credentials Status" subtitle="Whether the required environment variables are set.">
          {statusError ? (
            <ErrorBanner message={statusError} />
          ) : credStatus ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--a-ink2)]">Environment:</span>
                <StatusPill tone={envColor}>{credStatus.mpesa_env}</StatusPill>
                {credStatus.simulated && <StatusPill tone="amber">Simulated</StatusPill>}
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {(
                    [
                      ['MPESA_CONSUMER_KEY', credStatus.has_consumer_key],
                      ['MPESA_CONSUMER_SECRET', credStatus.has_consumer_secret],
                      ['MPESA_PASSKEY', credStatus.has_passkey],
                      ['MPESA_SHORTCODE', credStatus.has_shortcode],
                    ] as const
                  ).map(([label, set]) => (
                    <tr key={label} className="border-b border-[var(--a-border-soft)]">
                      <td className="py-2 font-mono text-xs text-[var(--a-muted)]">{label}</td>
                      <td className="py-2 text-right">
                        <StatusPill tone={set ? 'green' : 'red'}>{set ? 'Set' : 'Missing'}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AsyncButton label="Refresh" variant="outline" size="sm" onClick={fetchStatus} />
            </div>
          ) : (
            <p className="text-sm text-[var(--a-muted)]">Loading…</p>
          )}
        </AdminCard>

        <AdminCard title="Send Test STK Push" subtitle="Enter a phone number and amount to initiate a test payment.">
          <div className="space-y-4">
            <Field label="Phone Number" hint="Safaricom number, e.g. 0712345678" required>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712345678"
                className="w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 py-2 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-muted)] focus:border-[#E8510A] focus:outline-none focus:ring-1 focus:ring-[#E8510A]"
              />
            </Field>

            <Field label="Amount (KES)" required>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 py-2 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-muted)] focus:border-[#E8510A] focus:outline-none focus:ring-1 focus:ring-[#E8510A]"
              />
            </Field>

            <AsyncButton
              label="Send STK Push"
              loadingLabel="Sending…"
              loading={loading}
              onClick={handleTest}
              disabled={!phone || !amount || Number(amount) <= 0}
            />

            {result && (
              <div className={`rounded-lg border px-4 py-3 text-sm ${result.ok ? 'border-green-500/25 bg-green-500/5 text-green-700' : 'border-red-500/25 bg-red-500/5 text-red-600'}`}>
                <p className="font-semibold">{result.ok ? 'Success' : 'Failed'}</p>
                <p className="mt-1">{result.message || result.error}</p>
                {result.checkout_request_id && (
                  <p className="mt-1 font-mono text-xs opacity-70">Checkout ID: {result.checkout_request_id}</p>
                )}
                {result.simulate && (
                  <p className="mt-1 text-xs text-amber-600">This was a simulation — no real STK push was sent.</p>
                )}
              </div>
            )}
          </div>
        </AdminCard>
      </div>
    </>
  );
}

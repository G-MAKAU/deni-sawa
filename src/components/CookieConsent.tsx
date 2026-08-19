'use client';

import * as React from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

export const COOKIE_CONSENT_KEY = 'ds_cookie_consent';
export const COOKIE_CONSENT_VERSION = '2026-08';

interface CookiePrefs {
  essential: boolean;
  analytics: boolean;
  comms: boolean;
  timestamp: string;
  version: string;
}

function readPrefs(): CookiePrefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    return raw ? (JSON.parse(raw) as CookiePrefs) : null;
  } catch {
    return null;
  }
}

function writePrefs(prefs: CookiePrefs) {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent('ds-consent-change'));
}

/** Opens the cookie preferences modal from anywhere (e.g. the footer link). */
export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent('ds-cookie-settings'));
}

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (next: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cnToggle(on, disabled)}
    >
      <span
        className={`block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
          on ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function cnToggle(on: boolean, disabled?: boolean): string {
  const base = 'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30';
  if (disabled) return `${base} cursor-not-allowed opacity-60 ${on ? 'bg-[#5A9E28]' : 'bg-white/20'}`;
  return `${base} cursor-pointer ${on ? 'bg-[#E8510A]' : 'bg-white/20'}`;
}

export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);
  const [showPrefs, setShowPrefs] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(false);
  const [comms, setComms] = React.useState(false);

  React.useEffect(() => {
    const prefs = readPrefs();
    if (!prefs || prefs.version !== COOKIE_CONSENT_VERSION) {
      setVisible(true);
    } else {
      setAnalytics(prefs.analytics);
      setComms(prefs.comms);
    }
    const openSettings = () => setShowPrefs(true);
    window.addEventListener('ds-cookie-settings', openSettings);
    return () => window.removeEventListener('ds-cookie-settings', openSettings);
  }, []);

  const save = (analyticsVal: boolean, commsVal: boolean) => {
    writePrefs({
      essential: true,
      analytics: analyticsVal,
      comms: commsVal,
      timestamp: new Date().toISOString(),
      version: COOKIE_CONSENT_VERSION,
    });
    setVisible(false);
    setShowPrefs(false);
  };

  if (!visible && !showPrefs) return null;

  return (
    <>
      {visible && !showPrefs && (
        <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center px-4 pb-4">
          <div className="w-full max-w-[600px] rounded-t-lg bg-[#2C2C2C] p-6 text-white shadow-[0_-12px_40px_rgba(0,0,0,0.4)]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Cookie className="h-4.5 w-4.5 text-[#E8510A]" />
              </span>
              <div className="flex-1">
                <p className="text-[15px] font-semibold leading-snug">
                  We use cookies to improve your experience and analyse site usage.
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">
                  Read our{' '}
                  <Link href="/privacy" target="_blank" className="font-semibold text-[#E8510A] underline underline-offset-2">
                    Privacy Policy
                  </Link>{' '}
                  for details.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => save(true, true)}
                    className="rounded-lg bg-[#E8510A] px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#c94508]"
                  >
                    Accept all
                  </button>
                  <button
                    type="button"
                    onClick={() => save(false, false)}
                    className="rounded-lg border border-[#5A9E28] px-4 py-2.5 text-[13px] font-bold text-[#7fc247] transition-colors hover:bg-[#5A9E28]/10"
                  >
                    Essential only
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrefs(true)}
                    className="text-[13px] font-semibold text-white/70 underline underline-offset-2 transition-colors hover:text-white"
                  >
                    Manage preferences
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => save(false, false)}
                aria-label="Dismiss cookie banner (essential only)"
                className="rounded-md p-1 text-white/50 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrefs && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-[480px] rounded-xl bg-[#2C2C2C] p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Cookie preferences</h3>
              <button
                type="button"
                onClick={() => setShowPrefs(false)}
                aria-label="Close cookie preferences"
                className="rounded-md p-1 text-white/50 transition-colors hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">
              Manage which categories of cookies we may use. Essential cookies keep the site working and cannot be disabled.
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 p-4">
                <div>
                  <p className="text-[14px] font-semibold">Essential cookies</p>
                  <p className="mt-0.5 text-[12px] text-white/60">Required for the site to function — always on.</p>
                </div>
                <Toggle on disabled onChange={() => undefined} />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 p-4">
                <div>
                  <p className="text-[14px] font-semibold">Analytics cookies</p>
                  <p className="mt-0.5 text-[12px] text-white/60">Google Analytics 4 — helps us understand how the site is used.</p>
                </div>
                <Toggle on={analytics} onChange={setAnalytics} />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 p-4">
                <div>
                  <p className="text-[14px] font-semibold">Communications cookies</p>
                  <p className="mt-0.5 text-[12px] text-white/60">Remembering your communication preferences.</p>
                </div>
                <Toggle on={comms} onChange={setComms} />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPrefs(false)}
                className="rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white/70 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => save(analytics, comms)}
                className="rounded-lg bg-[#E8510A] px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#c94508]"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
'use client';

import * as React from 'react';
import Script from 'next/script';
import { COOKIE_CONSENT_KEY } from '@/components/CookieConsent';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google Analytics 4 with consent gating (GA4 Consent Mode v2).
 * The gtag script is only loaded once analytics consent is stored in
 * ds_cookie_consent with analytics: true. Consent changes (Accept all,
 * Manage preferences) re-evaluate via the 'ds-consent-change' event and
 * update analytics_storage to 'granted' / 'denied' accordingly.
 */
export function GoogleAnalytics() {
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    const apply = () => {
      let analyticsGranted = false;
      try {
        const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
        const prefs = raw ? JSON.parse(raw) : null;
        analyticsGranted = prefs?.analytics === true;
      } catch {
        analyticsGranted = false;
      }
      setEnabled(analyticsGranted);
      const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
      w.dataLayer = w.dataLayer ?? [];
      if (!w.gtag) {
        w.gtag = function gtag(...args: unknown[]) {
          (w.dataLayer as unknown[]).push(args);
        };
      }
      (w.gtag as (...args: unknown[]) => void)('consent', 'update', {
        analytics_storage: analyticsGranted ? 'granted' : 'denied',
      });
    };
    apply();
    window.addEventListener('ds-consent-change', apply);
    return () => window.removeEventListener('ds-consent-change', apply);
  }, []);

  if (!GA_ID) return null;

  return (
    <>
      {enabled && <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />}
      {enabled && (
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { anonymize_ip: true, analytics_storage: 'granted' });
          `}
        </Script>
      )}
    </>
  );
}
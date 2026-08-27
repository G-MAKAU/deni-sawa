'use client';

import * as React from 'react';
import Script from 'next/script';
import { COOKIE_CONSENT_KEY } from '@/components/CookieConsent';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google Analytics 4 with Consent Mode v2.
 * The gtag script ALWAYS loads so Google Tag Assistant can verify it.
 * Analytics data is only sent once the visitor grants analytics consent
 * via the cookie banner. Before consent, analytics_storage is 'denied'.
 */
export function GoogleAnalytics() {
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
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true, analytics_storage: 'denied' });
        `}
      </Script>
    </>
  );
}

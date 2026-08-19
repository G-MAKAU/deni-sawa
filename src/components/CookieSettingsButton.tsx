'use client';

import { openCookieSettings } from '@/components/CookieConsent';

/** Footer link that opens the cookie preferences modal. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      Cookie Settings
    </button>
  );
}
'use client';

import * as React from 'react';

export function SWRegistration() {
  const [registered, setRegistered] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    async function registerSW() {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        registration.addEventListener('updatefound', () => {
          const newWorker = registration?.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (confirm('A new version is available. Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });

        setRegistered(true);
        console.log('[SW] Registered:', registration.scope);
      } catch (error) {
        console.warn('[SW] Registration failed:', error);
      }
    }

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW, { once: true });
    }

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    return () => {
      // Don't unregister on unmount - SW should persist
    };
  }, []);

  return null;
}
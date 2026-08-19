'use client';

import * as React from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = React.useState(true);
  const [swSupported, setSwSupported] = React.useState(false);

  React.useEffect(() => {
    setIsOnline(navigator.onLine);
    setSwSupported('serviceWorker' in navigator);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline || !swSupported) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 animate-slide-up"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 shadow-lg min-w-[280px] max-w-md">
        <WifiOff className="h-5 w-5 text-red-600 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">You're offline</p>
          <p className="text-xs text-red-600 mt-0.5">
            Some features may be limited. Changes will sync when you're back online.
          </p>
        </div>
      </div>
      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}
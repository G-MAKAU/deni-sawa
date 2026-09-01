'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AIChatWidget } from '@/components/AIChatWidget';
import { cn } from '@/lib/utils';

function ScrollToHash() {
  const pathname = usePathname();
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      // No hash — reset to the top (instant, regardless of CSS scroll-behavior).
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }

    const id = decodeURIComponent(hash.slice(1));
    const el = document.getElementById(id);
    if (!el) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }

    // Let the target section settle after navigation, then scroll to it with
    // an offset so the sticky navbars don't cover it. (Next's own hash scroll
    // is otherwise cancelled by the scroll-to-top on route change.)
    const timer = window.setTimeout(() => {
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <ThemeProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ScrollToHash />
        {!isAdmin && <Navbar />}
        <main id="main-content" className={cn('flex-1', !isAdmin && 'mt-14')}>
          {children}
        </main>
        {!isAdmin && <Footer />}
        {!isAdmin && <AIChatWidget />}
      </div>
    </ThemeProvider>
  );
}

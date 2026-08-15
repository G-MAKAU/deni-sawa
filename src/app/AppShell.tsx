'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AIChatWidget } from '@/components/AIChatWidget';

function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo(0, 0);
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
        <ScrollToTop />
        {!isAdmin && <Navbar />}
        <main id="main-content" className="flex-1">
          {children}
        </main>
        {!isAdmin && <Footer />}
        {!isAdmin && <AIChatWidget />}
      </div>
    </ThemeProvider>
  );
}

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
      <div className="min-h-screen bg-background">
        <ScrollToTop />
        {!isAdmin && <Navbar />}
        <main className={isAdmin ? '' : 'pt-40 lg:pt-[212px]'}>{children}</main>
        {!isAdmin && <Footer />}
        {!isAdmin && <AIChatWidget />}
      </div>
    </ThemeProvider>
  );
}

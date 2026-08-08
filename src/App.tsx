import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AIChatWidget } from '@/components/AIChatWidget';
import { HomePage } from '@/pages/HomePage';
import { AboutPage } from '@/pages/AboutPage';

function ScrollToTopOnRoute() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <ScrollToTopOnRoute />
        <Navbar />
        {/* Reserve space for the fixed navbar — all routes/mains share this so
            content is never hidden beneath the header. Every new page inherits it. */}
        <main className="pt-40 lg:pt-[212px]">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        <Footer />
        <AIChatWidget />
      </div>
    </ThemeProvider>
  );
}

export default App;
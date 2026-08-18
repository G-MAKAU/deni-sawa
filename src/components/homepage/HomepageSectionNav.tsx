'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'Overview', id: 'overview' },
  { label: 'Services', id: 'services' },
  { label: 'Who We Serve', id: 'who-we-serve' },
  { label: 'Health Checks', id: 'health-checks' },
  { label: 'The Method', id: 'the-method' },
  { label: 'The Journey', id: 'the-journey' },
  { label: 'Insights', id: 'insights' },
  { label: 'The Network', id: 'the-network' },
  { label: 'Get Started', id: 'get-started' },
];

/** Sticky in-page anchor nav for the homepage — appears once the hero scrolls out of view. */
export function HomepageSectionNav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState('overview');
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    heroRef.current = document.getElementById('overview');
    const hero = heroRef.current;
    if (!hero) return;

    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: '-80px 0px 0px 0px', threshold: 0 }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [visible]);

  return (
    <div
      className={cn(
        'sticky top-0 z-30 border-b border-card-border bg-nav transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
      )}
    >
      <div className="container-lux">
        <div className="scrollbar-hide flex h-11 items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              aria-current={active === link.id ? 'true' : undefined}
              className={cn(
                'whitespace-nowrap border-b-2 border-transparent px-4 text-[13px] font-medium transition-colors',
                active === link.id ? 'text-brand' : 'text-muted-foreground hover:text-brand'
              )}
              style={active === link.id ? { borderColor: '#E8510A' } : undefined}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
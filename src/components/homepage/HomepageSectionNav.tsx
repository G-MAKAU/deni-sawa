'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'Overview', id: 'overview' },
  { label: 'Who We Serve', id: 'who-we-serve' },
  { label: 'Health Checks', id: 'health-checks' },
  { label: 'Insights', id: 'insights' },
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
    const ids = LINKS.map((l) => l.id);
    const onScroll = () => {
      // Follow the document flow: the active section is the last one whose top
      // has crossed above the sticky nav (with a small buffer).
      const pos = window.scrollY + 80;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= pos) current = id;
        else break;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
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
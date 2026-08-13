'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Check, ArrowRight, Landmark, GraduationCap, BookOpen, Building2, Briefcase, Brain, type LucideIcon } from 'lucide-react';
import { services } from '@/data/content';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = { Landmark, GraduationCap, BookOpen, Building2, Briefcase, Brain };

interface ServiceNavigatorProps {
  activeSlug?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Elegant dropdown that lists every Deni Sawa division and links to its
 * dedicated /services/[slug] page. Renders the active service on the label.
 */
export function ServiceNavigator({ activeSlug, className, compact }: ServiceNavigatorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const active = services.find((s) => s.slug === activeSlug);
  const ActiveIcon = active ? iconMap[active.icon] ?? Landmark : Landmark;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-2.5 rounded-full border border-border bg-card px-4 text-left text-sm font-semibold transition-all duration-300 hover:border-brand/40 hover:text-brand',
          compact ? 'py-2' : 'py-2.5 pr-2.5'
        )}
      >
        {ActiveIcon && <ActiveIcon className="h-4 w-4 flex-shrink-0 text-brand" strokeWidth={2} />}
        <span className="truncate">{active ? active.tab : 'Browse Services'}</span>
        <ChevronDown className={cn('h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-300', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-soft-xl sm:w-80">
            <div className="border-b border-border bg-ink-25 px-4 py-2.5 dark:bg-ink-800/50">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Explore a division
              </p>
            </div>
            <ul role="listbox" className="max-h-80 overflow-y-auto p-2">
              {services.map((service) => {
                const Icon = iconMap[service.icon] ?? Landmark;
                const isActive = service.slug === activeSlug;
                const isGreen = service.tab === 'Coaching' || service.tab === 'Wellness';
                return (
                  <li key={service.slug} role="option" aria-selected={isActive}>
                    <Link
                      href={`/services/${service.slug}`}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                        isActive ? 'bg-brand/10' : 'hover:bg-ink-25 dark:hover:bg-ink-800/60'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-colors',
                          isGreen ? 'bg-green/10 text-green' : 'bg-brand/10 text-brand'
                        )}
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">{service.tab}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{service.title}</span>
                      </span>
                      {isActive ? (
                        <Check className="h-4 w-4 flex-shrink-0 text-brand" />
                      ) : (
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
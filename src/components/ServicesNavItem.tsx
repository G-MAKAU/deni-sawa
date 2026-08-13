'use client';

import Link from 'next/link';
import {
  ChevronDown, ArrowRight,
  Landmark, GraduationCap, BookOpen, Building2, Briefcase, Brain, type LucideIcon,
} from 'lucide-react';
import { services } from '@/data/content';
import { cn } from '@/lib/utils';

export const serviceIconMap: Record<string, LucideIcon> = { Landmark, GraduationCap, BookOpen, Building2, Briefcase, Brain };

interface ServicesNavItemProps {
  active: boolean;
  currentSlug?: string;
}

/**
 * Elegant hover dropdown for the Services nav item. Lists every division with
 * a link to its dedicated /services/[slug] page.
 */
export function ServicesNavItem({ active, currentSlug }: ServicesNavItemProps) {
  return (
    <div className="group relative">
      <Link
        href="/services"
        className={cn(
          'relative flex items-center gap-1 rounded-full px-3.5 py-2 text-base font-bold transition-all duration-300',
          active
            ? 'text-white bg-brand shadow-brand-sm rounded-none'
            : 'text-foreground/80 hover:text-brand hover:bg-brand/10'
        )}
      >
        Services
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180',
            active ? 'text-white' : 'text-muted-foreground'
          )}
        />
      </Link>

      {/* Dropdown panel */}
      <div className="invisible absolute left-1/2 top-full z-50 w-[560px] max-w-[calc(100vw-2rem)] -translate-x-1/2 pt-3 opacity-0 transition-all duration-300 group-hover:visible group-hover:opacity-100 xl:w-[740px]">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft-xl">
          <div className="flex items-center justify-between border-b border-border bg-ink-25 px-5 py-3.5 dark:bg-ink-800/50">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Our Divisions</p>
            <Link
              href="/services"
              className="inline-flex items-center gap-1 text-sm font-bold text-brand transition-all duration-300 hover:gap-2"
            >
              All Services <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-1 p-2">
            {services.map((service) => {
              const Icon = serviceIconMap[service.icon] ?? Landmark;
              const isGreen = service.tab === 'Coaching' || service.tab === 'Wellness';
              const isCurrent = service.slug === currentSlug;
              return (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={cn(
                    'group/item relative flex items-start gap-3 rounded-2xl px-3 py-3.5 transition-colors hover:bg-brand/10',
                    isCurrent && 'bg-brand/10 ring-1 ring-inset ring-brand/20'
                  )}
                >
                  {isCurrent && (
                    <span className="absolute -left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-brand" />
                  )}
                  <span
                    className={cn(
                      'mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors',
                      isGreen ? 'bg-green/10 text-green' : 'bg-brand/10 text-brand',
                      isCurrent && (isGreen ? 'bg-green text-white' : 'bg-brand text-white')
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        'block truncate text-[15px] font-bold transition-colors group-hover/item:text-brand',
                        isCurrent ? 'text-brand' : 'text-foreground'
                      )}
                    >
                      {service.tab}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-muted-foreground line-clamp-2">
                      {service.summary}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-border bg-ink-25 px-5 py-3.5 dark:bg-ink-800/50">
            <Link
              href="/services#programs"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-brand"
            >
              View our structured 12–48 week programmes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
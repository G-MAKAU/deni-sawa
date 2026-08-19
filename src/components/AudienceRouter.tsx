'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Briefcase, Building2, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Audience {
  title: string;
  accent: 'brand' | 'growth';
  journey: string;
  description: string;
  cta: string;
  href: string;
}

const ICONS = [Briefcase, Building2, Landmark] as const;

const PROMPTS = [
  "I'm a professional",
  "I run a business",
  "I'm an investor",
] as const;

/** Accepts the audiences array from site.ts (accent is typed as string there). */
type AudienceInput = Omit<Audience, 'accent'> & { accent: string };

/**
 * Progressive "Which describes you?" router over the Who-We-Serve profiles.
 * Typography-led rows with hairline dividers — selecting a profile highlights
 * the matching pathway and reveals the recommended next step. No boxes.
 */
export function AudienceRouter({ audiences }: { audiences: AudienceInput[] }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
        <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Which describes you?
        </span>
        {PROMPTS.map((prompt, i) => (
          <button
            key={prompt}
            type="button"
            onClick={() => setActive(active === i ? null : i)}
            aria-pressed={active === i}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              active === i
                ? 'border-brand bg-brand text-white'
                : 'border-card-border bg-card text-foreground hover:border-brand/40 hover:text-brand'
            )}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {audiences.map((audience, i) => {
          const Icon = ICONS[i] ?? Briefcase;
          const highlighted = active === null || active === i;
          return (
            <Link
              key={audience.title}
              href={audience.href}
              aria-label={`${audience.title} — ${audience.cta}`}
              className={cn(
                'card-elevated group flex h-full flex-col overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg',
                active !== null && !highlighted && 'opacity-45 saturate-50'
              )}
            >
              <div className={cn('h-1.5 w-full', audience.accent === 'brand' ? 'bg-brand' : 'bg-growth')} />
              <div className="flex flex-1 flex-col p-8">
                <span
                  className={cn(
                    'inline-flex h-11 w-11 items-center justify-center rounded-lg',
                    audience.accent === 'brand' ? 'bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white' : 'bg-growth/10 text-growth group-hover:bg-growth group-hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 text-h3 font-semibold text-foreground transition-colors group-hover:text-brand">
                  {audience.title}
                </h3>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {audience.journey}
                </p>
                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-muted-foreground">{audience.description}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-all duration-200 group-hover:gap-3">
                  {audience.cta}
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {active !== null && (
        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-3 rounded-xl border border-brand/25 bg-brand/5 px-6 py-4 text-center">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{audiences[active].title}:</span>{' '}
            {audiences[active].description}
          </p>
          <Link
            href={audiences[active].href}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            {audiences[active].cta}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
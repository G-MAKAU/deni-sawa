'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Briefcase, Building2, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface AudiencePathway {
  stage: string;
  description: string;
}

interface Audience {
  title: string;
  accent: 'brand' | 'growth';
  journey: string;
  description: string;
  cta: string;
  href: string;
  servicesHref?: string;
  pathway?: AudiencePathway[];
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
  const selected = active !== null ? audiences[active] : null;

  const renderPathway = (audience: AudienceInput) => (
    <>
      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
            {audience.title} pathway
          </p>
          <h4 className="mt-2 text-h3 font-semibold text-foreground">{audience.journey}</h4>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            {audience.description}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
          <Link
            href={audience.href}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            {audience.cta}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          {audience.servicesHref && (
            <Link
              href={audience.servicesHref}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-all hover:gap-3"
            >
              Explore {audience.title} services
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {audience.pathway && audience.pathway.length > 0 && (
        <div className="border-t border-brand/10 bg-background/60 px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-center">
            {audience.pathway.map((path, i) => {
              const last = i === audience.pathway!.length - 1;
              return (
                <div key={path.stage} className="flex w-full flex-col lg:w-auto lg:contents">
                  <div
                    className={cn(
                      'relative flex w-full items-center gap-4 rounded-xl border bg-card p-5 transition-all duration-300 lg:flex-1',
                      last
                        ? 'border-brand/40 bg-brand/[0.06] shadow-soft'
                        : 'border-card-border hover:border-growth/40'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm font-bold shadow-soft',
                        last
                          ? 'border-brand bg-brand text-white'
                          : 'border-growth bg-background text-growth'
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">{path.stage}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {path.description}
                      </p>
                    </div>
                  </div>

                  {!last && (
                    <div className="flex items-center justify-center py-1 lg:px-1 lg:py-0">
                      <span
                        aria-hidden
                        className={cn(
                          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-colors',
                          'border-brand/20 bg-brand/10 text-brand'
                        )}
                      >
                        <ArrowRight className="h-4 w-4 rotate-90 lg:rotate-0" />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

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
            <div key={audience.title} className="flex h-full flex-col gap-6">
              <Link
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
                  <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.16em] text-brand font-bold">
                    {audience.journey}
                  </p>
                  <p className="mt-4 flex-1 text-[15px] leading-relaxed text-muted-foreground">{audience.description}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-all duration-200 group-hover:gap-3">
                    {audience.cta}
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>

              {active === i && (
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden rounded-xl border border-brand/20 bg-gradient-to-br from-brand/[0.06] to-growth/[0.04] md:hidden"
                >
                  {renderPathway(audience)}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 hidden overflow-hidden rounded-xl border border-brand/20 bg-gradient-to-br from-brand/[0.06] to-growth/[0.04] md:block"
        >
          {renderPathway(selected)}
        </motion.div>
      )}
    </div>
  );
}
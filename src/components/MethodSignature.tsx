'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Target, Lightbulb, Building2 } from 'lucide-react';
import { methodSteps } from '@/data/site';
import { cn } from '@/lib/utils';
import { useMounted } from '@/lib/hooks';

/**
 * Signature Deni Sawa Method™ experience: a D→E→N→I→S progression where each
 * stage reveals its definition, objective, an example and the service that
 * brings it to life. Designed to feel like a premium editorial device — not
 * another set of cards.
 */
export function MethodSignature() {
  const prefersReducedMotion = useReducedMotion();
  const mounted = useMounted();

  return (
    <div className="relative">
      {/* Left rail (desktop) */}
      <div
        aria-hidden
        className="absolute left-0 top-0 hidden h-full w-px bg-gradient-to-b from-brand/40 via-brand/20 to-transparent lg:block"
      />

      <ol className="space-y-0">
        {methodSteps.map((step, i) => {
          const last = i === methodSteps.length - 1;
          return (
            <li key={step.letter} className="relative lg:pl-14">
              {/* Rail dot */}
              <motion.span
                initial={!mounted || prefersReducedMotion ? false : { scale: 0.6, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={cn(
                  'absolute left-0 top-7 hidden h-3 w-3 rounded-full ring-4 ring-background lg:block',
                  last ? 'bg-brand' : 'bg-growth'
                )}
              />

              <motion.div
                initial={!mounted || prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className={cn('group border-b border-card-border py-8 lg:py-10', last && 'border-b-0')}
              >
                <div className="flex items-start gap-6">
                  <span
                    className={cn(
                      'flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 text-2xl font-bold transition-colors',
                      last
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-growth bg-growth/5 text-growth'
                    )}
                  >
                    {step.letter}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-h3 font-semibold text-foreground">{step.title}</h3>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {step.description}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" strokeWidth={1.8} />
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          <span className="font-semibold text-foreground">Objective.</span>{' '}
                          {step.objective}
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-growth" strokeWidth={1.8} />
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          <span className="font-semibold text-foreground">In practice.</span>{' '}
                          {step.example}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <Link
                        href={step.service}
                        className={cn(
                          'inline-flex items-center gap-1.5 text-sm font-semibold transition-colors',
                          last ? 'text-brand hover:text-brand-600' : 'text-growth hover:text-growth-600'
                        )}
                      >
                        <Building2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {step.serviceLabel}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
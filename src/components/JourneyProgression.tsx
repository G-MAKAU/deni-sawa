'use client';

import { motion, useReducedMotion } from 'motion/react';
import { HeartPulse, Shield, TrendingUp, Award } from 'lucide-react';
import { journeyStages } from '@/data/site';
import { cn } from '@/lib/utils';

const ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  HeartPulse,
  Shield,
  TrendingUp,
  Award,
};

/**
 * Signature visual for the Recovery → Resilience → Growth → Best-in-Class
 * narrative. A connected progression line with numbered stages, designed to
 * feel like a deliberate editorial device rather than another card grid.
 */
export function JourneyProgression() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative">
      {/* Connecting line (desktop horizontal, mobile vertical) */}
      <div
        aria-hidden
        className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-brand/40 via-brand/20 to-transparent lg:left-0 lg:top-7 lg:h-px lg:w-full lg:bg-gradient-to-r"
      />

      <ol className="grid grid-cols-1 gap-10 lg:grid-cols-4 lg:gap-6">
        {journeyStages.map((stage, i) => {
          const Icon = ICONS[stage.icon] ?? TrendingUp;
          const last = i === journeyStages.length - 1;
          return (
            <li key={stage.stage} className="relative lg:pl-0 lg:pr-4">
              <div className="relative flex items-start gap-5 lg:flex-col lg:items-start">
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.1 }}
                  className={cn(
                    'relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 bg-background shadow-soft',
                    last ? 'border-brand text-brand' : 'border-growth text-growth'
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </motion.div>

                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.1 + 0.05 }}
                  className="lg:mt-6"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Stage {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3
                    className={cn(
                      'mt-1 font-display text-2xl font-semibold',
                      last ? 'text-brand' : 'text-foreground'
                    )}
                  >
                    {stage.stage}
                  </h3>
                  <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
                    {stage.description}
                  </p>
                </motion.div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
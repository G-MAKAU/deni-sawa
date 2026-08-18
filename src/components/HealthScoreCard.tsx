'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMounted } from '@/lib/hooks';

interface Level {
  label: string;
  text: string;
  bg: string;
}

const LEVELS: Level[] = [
  { label: 'Fragile', text: 'text-destructive', bg: 'bg-destructive/15' },
  { label: 'Stable', text: 'text-brand', bg: 'bg-brand/15' },
  { label: 'Resilient', text: 'text-growth', bg: 'bg-growth/15' },
];

function levelFor(score: number): Level {
  if (score >= 70) return LEVELS[2];
  if (score >= 40) return LEVELS[1];
  return LEVELS[0];
}

function thumbFor(score: number): string {
  if (score >= 70) return 'var(--growth)';
  if (score >= 40) return 'var(--brand)';
  return 'hsl(var(--destructive))';
}

interface HealthScoreCardProps {
  className?: string;
}

export function HealthScoreCard({ className = '' }: HealthScoreCardProps) {
  const [score, setScore] = useState(72);
  const [trend, setTrend] = useState<'up' | 'down' | 'flat'>('up');
  const prevRef = useRef(72);
  const prefersReducedMotion = useReducedMotion();
  const mounted = useMounted();

  // Scroll behaviour: on load the card lifts a little above its settled
  // position over the hero; as the user scrolls it eases down to rest in
  // place. Both the lift and the scroll distance that settles it are derived
  // from the viewport height so the effect scales across screen sizes. On
  // mobile (< lg) the card renders in its inline position from the start.
  const [isDesktop, setIsDesktop] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !isDesktop || prefersReducedMotion) return;

    let raf = 0;
    const render = () => {
      raf = 0;
      const lift = Math.min(Math.round(window.innerHeight * 0.06), 56);
      const settleRange = Math.round(window.innerHeight * 0.4);
      const p = Math.min(window.scrollY / settleRange, 1);
      const eased = 1 - Math.pow(1 - p, 2);
      el.style.transform = `translateY(${(-lift * (1 - eased)).toFixed(1)}px) scale(${(1.06 - 0.06 * eased).toFixed(4)})`;
      el.style.boxShadow = `0 ${Math.round(16 - 6 * eased)}px ${Math.round(50 - 10 * eased)}px rgba(232, 81, 10, ${(0.22 - 0.06 * eased).toFixed(3)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    render();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = '';
      el.style.boxShadow = '';
    };
  }, [isDesktop, prefersReducedMotion]);

  const level = levelFor(score);

  const setFrom = (value: number) => {
    setTrend(value > prevRef.current ? 'up' : value < prevRef.current ? 'down' : 'flat');
    prevRef.current = value;
    setScore(value);
  };

  // Gentle drift so the score feels live when left idle.
  useEffect(() => {
    const t = setInterval(() => {
      setFrom(Math.max(20, Math.min(95, score + Math.round(Math.random() * 4) - 2)));
    }, 2200);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  return (
    <div
      ref={cardRef}
      className={cn(
        'mx-auto w-full max-w-sm rounded-lg border border-card-border bg-card p-5 shadow-[0_10px_40px_rgba(232,81,10,0.16)] will-change-transform sm:w-72',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-brand">Business Health Score</p>
      </div>

      <div className="mt-3 flex items-end gap-1.5">
        <motion.span
          key={level.label}
          initial={!mounted || prefersReducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn('font-display text-5xl font-bold leading-none', level.text)}
        >
          {score}
        </motion.span>
        <span className="mb-1 text-sm text-muted-foreground">/100</span>
        <motion.span
          key={`${level.label}-${trend}`}
          initial={!mounted || prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={cn(
            'ml-auto mb-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            level.bg,
            level.text
          )}
        >
          {trend === 'up' ? (
            <TrendingUp className="h-3 w-3" />
          ) : trend === 'down' ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <Minus className="h-3 w-3" />
          )}
          {level.label}
        </motion.span>
      </div>

      {/* Range — drag to change the score */}
      <div className="relative mt-4">
        <input
          type="range"
          min={0}
          max={100}
          value={score}
          onChange={(e) => setFrom(Number((e.target as HTMLInputElement).value))}
          aria-label="Business health score"
          className="hs-range w-full cursor-pointer"
          style={
            {
              '--hs-pct': `${score}%`,
              '--hs-thumb': thumbFor(score),
            } as React.CSSProperties
          }
        />
      </div>

      <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        <span>Fragile</span>
        <span>Stable</span>
        <span>Resilient</span>
      </div>

      <Link
        href="/business-health-checks/business-health-check"
        className="mt-4 flex items-center justify-between rounded-lg bg-brand px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
      >
        Free Diagnostic
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  if (score >= 70) return '#5A9E28';
  if (score >= 40) return '#E8510A';
  return '#E11D48';
}

interface HealthScoreCardProps {
  className?: string;
}

export function HealthScoreCard({ className = '' }: HealthScoreCardProps) {
  const [score, setScore] = useState(72);
  const [trend, setTrend] = useState<'up' | 'down' | 'flat'>('up');
  const prevRef = useRef(72);

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
    <div className={cn('w-72 rounded-xl border border-card-border bg-card p-5 shadow-2xl shadow-black/40', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-brand">Business Health Score</p>
        <span className="rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-foreground">
          AI
        </span>
      </div>

      <div className="mt-3 flex items-end gap-1.5">
        <span
          className={cn(
            'font-display text-5xl font-bold leading-none transition-colors duration-300',
            level.text
          )}
        >
          {score}
        </span>
        <span className="mb-1 text-sm text-muted-foreground">/100</span>
        <span
          className={cn(
            'ml-auto mb-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors duration-300',
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
        </span>
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
        href="/health-checks"
        className="mt-4 flex items-center justify-between rounded-lg border border-brand/30 bg-brand/10 px-3 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-brand/50 hover:bg-brand/20"
      >
        Free AI Diagnostic
        <ArrowRight className="h-3.5 w-3.5 text-brand" />
      </Link>
    </div>
  );
}

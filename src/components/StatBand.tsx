import { cn } from '@/lib/utils';

interface Stat {
  value: number | string;
  suffix?: string;
  label: string;
}

interface StatBandProps {
  stats: Stat[];
  dark?: boolean;
}

/**
 * Big-number stat band — display-scale values separated by vertical hairlines.
 * Deliberately borderless so numbers read as a statement, not a grid of boxes.
 */
export function StatBand({ stats, dark = false }: StatBandProps) {
  return (
    <dl
      className={cn(
        'grid grid-cols-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0',
        dark ? 'lg:divide-x lg:divide-white/10' : 'lg:divide-x lg:divide-card-border'
      )}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="text-center lg:px-6 first:pl-0 last:pr-0">
          <dd className="font-display text-4xl font-semibold text-brand sm:text-5xl">
            {stat.value}
            {stat.suffix && <span className="text-brand">{stat.suffix}</span>}
          </dd>
          <dt className={cn('mt-2 text-sm leading-relaxed', dark ? 'text-white/60' : 'text-muted-foreground')}>
            {stat.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

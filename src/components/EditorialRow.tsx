import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorialRowProps {
  index: string;
  title: string;
  description: string;
  href: string;
  cta?: string;
  meta?: string;
  accent?: 'brand' | 'growth';
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  last?: boolean;
}

/**
 * Typographic index row — the informational counterpart to a card. Numbered,
 * full-width, separated by a hairline. Used wherever a section lists options
 * so the single carded element (if any) keeps its role as the section anchor.
 */
export function EditorialRow({
  index,
  title,
  description,
  href,
  cta,
  meta,
  accent = 'brand',
  icon: Icon,
  last = false,
}: EditorialRowProps) {
  return (
    <Link
      href={href}
      className={cn('group grid grid-cols-1 items-start gap-3 py-6 md:grid-cols-[3rem_3.5rem_1fr_auto] md:items-center md:gap-8 md:py-7', !last && 'border-b border-card-border')}
    >
      <span className="font-mono text-sm font-bold text-muted-foreground transition-colors group-hover:text-brand">
        {index}
      </span>

      {Icon && (
        <span
          className={cn(
            'hidden h-11 w-11 items-center justify-center rounded-lg transition-colors md:inline-flex',
            accent === 'brand' ? 'bg-brand/10 text-brand' : 'bg-growth/10 text-growth'
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
      )}

      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-h3 font-semibold text-foreground transition-colors group-hover:text-brand">
            {title}
          </h3>
          {meta && (
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {meta}
            </span>
          )}
        </div>
        <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      <span
        className={cn(
          'inline-flex items-center gap-1.5 justify-self-start text-sm font-semibold transition-colors md:justify-self-end',
          accent === 'brand' ? 'text-brand group-hover:text-brand-600' : 'text-growth group-hover:text-growth-600'
        )}
      >
        {cta ?? 'Learn More'}
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </Link>
  );
}

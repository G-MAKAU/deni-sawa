import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullQuoteProps {
  quote: string;
  author: string;
  role?: string;
  dark?: boolean;
}

/**
 * Single editorial testimonial — oversized quote mark, statement, attribution.
 * The quiet, confident alternative to a grid of testimonial cards.
 */
export function PullQuote({ quote, author, role, dark = false }: PullQuoteProps) {
  return (
    <figure className="relative mx-auto max-w-3xl text-center">
      <Quote
        className={cn('mx-auto h-8 w-8', dark ? 'text-brand' : 'text-brand')}
        strokeWidth={1.4}
      />
      <blockquote
        className={cn(
          'mt-6 font-display text-2xl font-medium leading-snug md:text-3xl',
          dark ? 'text-white' : 'text-foreground'
        )}
      >
        "{quote}"
      </blockquote>
      <figcaption className="mt-7">
        <p className="text-sm font-semibold text-white">{author}</p>
        {role && <p className={cn('mt-0.5 text-sm', dark ? 'text-white/50' : 'text-muted-foreground')}>{role}</p>}
      </figcaption>
    </figure>
  );
}

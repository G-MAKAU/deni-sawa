import { cn } from '@/lib/utils';
import { Reveal } from '@/components/Reveal';

interface SectionHeadingProps {
  eyebrow?: string;
  eyebrowTone?: 'brand' | 'growth' | 'on-dark';
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Alias for `subtitle`. */
  description?: React.ReactNode;
  align?: 'left' | 'center';
  dark?: boolean;
  /** Alias for `dark`. */
  light?: boolean;
  className?: string;
}

/**
 * Standard section heading: mono eyebrow label, serif-free H2 and optional
 * subtitle. One visual anchor per section — use sparingly.
 */
export function SectionHeading({
  eyebrow,
  eyebrowTone = 'brand',
  title,
  subtitle,
  description,
  align = 'center',
  dark = false,
  light = false,
  className,
}: SectionHeadingProps) {
  const copy = subtitle ?? description;
  const onDark = dark || light;
  return (
    <Reveal
      className={cn(
        'mb-12 flex flex-col gap-4 md:mb-16',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            'eyebrow',
            eyebrowTone === 'brand' && 'text-brand',
            eyebrowTone === 'growth' && 'text-growth',
            eyebrowTone === 'on-dark' && 'text-brand'
          )}
        >
          <span className="divider-accent" />
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          'text-h2 font-semibold',
          onDark ? 'text-white' : 'text-foreground',
          align === 'center' && 'mx-auto max-w-3xl'
        )}
      >
        {title}
      </h2>
      {copy && (
        <p
          className={cn(
            'max-w-2xl text-lg leading-relaxed',
            onDark ? 'text-white/70' : 'text-muted-foreground',
            align === 'center' && 'mx-auto'
          )}
        >
          {copy}
        </p>
      )}
    </Reveal>
  );
}

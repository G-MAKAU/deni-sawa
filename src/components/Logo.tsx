import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const LOGO = '/Deni-sawa-main-logo.webp';

const SIZES = {
  sm: 'h-16 sm:h-16',
  md: 'h-16 sm:h-16',
  lg: 'h-16 sm:h-16',
} as const;

interface LogoProps {
  /** 'light' = shown on light surfaces; 'dark' = shown on dark surfaces (white filtered) */
  tone?: 'light' | 'dark';
  /** Render the original brand colours instead of the tone-based filter. */
  color?: boolean;
  /** Logo image size. */
  size?: keyof typeof SIZES;
  /** Center the logo + tagline horizontally (navbar style). */
  center?: boolean;
  /** Stretch the logo image to fill the container height (navbar scrolled state). */
  fill?: boolean;
  href?: string;
  className?: string;
  /** Optional sublabel rendered below the logo (e.g. "Debt Management"). */
  tagline?: string;
  /** Whether the sublabel is currently visible (hidden on scroll). */
  showTagline?: boolean;
}

/**
 * Deni Sawa Partners logo. Uses the brand logo image; on dark surfaces the
 * image is filtered to a white monochrome variant unless `color` is set.
 * An optional tagline sits below the logo and collapses when `showTagline`
 * is false. With `fill`, the image stretches to the full container height.
 */
export function Logo({
  tone = 'light',
  color = false,
  size = 'md',
  center = false,
  fill = false,
  href = '/',
  className,
  tagline,
  showTagline = true,
}: LogoProps) {
  const monochrome = !color && tone === 'dark';

  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex flex-col',
        fill ? 'gap-0' : 'gap-1.5',
        center ? 'items-center' : 'items-start',
        className
      )}
      aria-label="Deni Sawa Partners — Home"
    >
      <Image
        src={LOGO}
        alt="Deni Sawa"
        width={640}
        height={200}
        priority
        className={cn(
          'w-auto object-contain transition-all duration-300 ease-out',
          fill ? 'h-16 lg:h-[76px]' : SIZES[size],
          monochrome && 'brightness-0 invert',
          !showTagline && !fill && 'sm:h-10'
        )}
      />
      {tagline && (
        <span
          className={cn(
            'overflow-hidden -mt-3 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 ease-out',
            monochrome ? 'text-white/55' : 'ml-3 text-brand font-bold italic',
            showTagline ? 'max-h-5 opacity-100' : 'max-h-0 -translate-y-1 opacity-0'
          )}
        >
          {tagline}
        </span>
      )}
    </Link>
  );
}

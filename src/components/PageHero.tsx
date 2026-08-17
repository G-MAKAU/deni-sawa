import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/Reveal';

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeroImage {
  src: string;
  alt: string;
}

interface PageHeroProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  crumbs?: Crumb[];
  /** Renders a charcoal hero with white text — use for page-level heroes. */
  dark?: boolean;
  /** Optional framed image on the right (desktop). */
  image?: PageHeroImage;
  children?: React.ReactNode;
  className?: string;
}

/** Shared page-level hero with breadcrumb, eyebrow, serif H1 and optional CTAs. */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  crumbs = [],
  dark = true,
  image,
  children,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden',
        dark ? 'bg-charcoal hero-pattern text-white' : 'bg-bgalt text-foreground',
        className
      )}
    >
      <div className="container-lux section-pad">
        {crumbs.length > 0 && (
          <Reveal>
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm">
              <Link href="/" className={cn('transition-colors', dark ? 'text-white/60 hover:text-brand' : 'text-muted-foreground hover:text-brand')}>
                Home
              </Link>
              {crumbs.map((crumb) => (
                <span key={crumb.label} className="flex items-center gap-1.5">
                  <ChevronRight className={cn('h-3.5 w-3.5', dark ? 'text-white/30' : 'text-muted-foreground/40')} />
                  {crumb.href ? (
                    <Link href={crumb.href} className={cn('transition-colors', dark ? 'text-white/60 hover:text-brand' : 'text-muted-foreground hover:text-brand')}>
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={dark ? 'text-white' : 'text-foreground'}>{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </Reveal>
        )}

        <div className={cn('grid gap-10', image && 'lg:grid-cols-2 mt-12 lg:items-stretch')}>
          <div className={cn('max-w-3xl', image && 'lg:max-w-none')}>
            {eyebrow && (
              <Reveal>
                <span className={cn('eyebrow mb-5 block items-start gap-2 text-brand')}>
                  <span className="divider-accent" />
                  {eyebrow}
                </span>
              </Reveal>
            )}
            <Reveal delay={80}>
              <h1 className={cn('hero-display', dark ? 'text-white text-h1' : 'text-foreground text-h1')}>{title}</h1>
            </Reveal>
            {subtitle && (
              <Reveal delay={160}>
                <p className={cn('mt-6 max-w-2xl text-lg leading-relaxed', dark ? 'text-white/70' : 'text-muted-foreground')}>
                  {subtitle}
                </p>
              </Reveal>
            )}
            {children && <Reveal delay={240} className="mt-8 flex flex-wrap items-center gap-4">{children}</Reveal>}
          </div>

          {image && (
            <Reveal direction="left" delay={160} className="lg:h-full">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-white/10 shadow-soft-xl lg:aspect-auto lg:h-full lg:min-h-[460px]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

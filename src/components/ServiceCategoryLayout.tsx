import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/Reveal';
import { Button } from '@/components/ui/button';
import { ServiceJourney, type ServiceJourneyConfig } from '@/components/ServiceJourney';

export interface ServiceSub {
  label: string;
  bullets: string[];
  image?: { src: string; alt: string };
  description?: string;
}

export interface ServiceCategoryConfig {
  number: string;
  name: string;
  positioningTag: string;
  description: string;
  heroImage?: { src: string; alt: string };
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  subServices: ServiceSub[];
  outcomes: string[];
  subServiceEyebrow?: string;
  journey?: ServiceJourneyConfig;
}

export interface ServiceCategoryLayoutProps {
  config: ServiceCategoryConfig;
  backHref?: string;
  backLabel?: string;
  anchorNavItems?: { label: string; href: string }[];
}

export function ServiceCategoryLayout({
  config,
  backHref = '/services',
  backLabel = 'Services',
  anchorNavItems,
}: ServiceCategoryLayoutProps) {
  const {
    number,
    name,
    positioningTag,
    description,
    heroImage,
    primaryCta,
    secondaryCta,
    subServices,
    outcomes,
    subServiceEyebrow = 'What We Offer',
    journey,
  } = config;

  const anchorItems = anchorNavItems ?? [
    ...subServices.map((sub, i) => ({ label: sub.label, href: `#sub-${i + 1}` })),
    ...(journey ? [{ label: 'Your Journey', href: '#journey' }] : []),
    { label: 'Outcomes', href: '#outcomes' },
    { label: 'Get Started', href: '#get-started' },
  ];

  return (
    <>
      {/* Back link bar */}
      <div className="border-b border-card-border bg-card">
        <div className="container-lux flex h-14 items-center">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to {backLabel}
          </Link>
        </div>
      </div>

      {/* Hero section */}
      <section className="relative overflow-hidden bg-charcoal text-white">
        {heroImage && (
          <div className="absolute inset-0">
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/90 to-charcoal/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-charcoal/60" />
          </div>
        )}
        <div className="container-lux section-pad relative">
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Reveal>
                <span className="mb-6 block font-mono text-[11px] uppercase tracking-[0.2em] text-brand">
                  {number} / Services
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="hero-display text-h1 text-white">{number}</h1>
              </Reveal>
              <Reveal delay={140}>
                <h2 className="text-h2 font-semibold text-white">{name}</h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="mt-4 text-xl font-medium italic text-green">{positioningTag}</p>
              </Reveal>
              <Reveal delay={260}>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">{description}</p>
              </Reveal>

              <Reveal delay={320} className="mt-8 flex flex-wrap gap-4">
                {primaryCta && (
                  <Button asChild size="lg">
                    <Link href={primaryCta.href}>
                      {primaryCta.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {secondaryCta && (
                  <Button asChild size="lg" variant="ghost" className="text-white hover:text-brand">
                    <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                  </Button>
                )}
              </Reveal>
            </div>

            {heroImage && (
              <div className="relative hidden lg:col-span-2 lg:block">
                <Reveal direction="left" delay={200} className="h-full">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-white/10 shadow-soft-xl">
                    <Image
                      src={heroImage.src}
                      alt={heroImage.alt}
                      fill
                      sizes="(max-width: 1024px) 0px, 40vw"
                      className="object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-transparent" />
                  </div>
                </Reveal>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Anchor navigation */}
      <section className="sticky top-0 z-30 border-b border-card-border bg-background/95 backdrop-blur-md">
        <div className="container-lux">
          <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto py-3">
            {anchorItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-badge border border-card-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Sub-service sections */}
      <section className="section-pad bg-background">
        <div className="container-lux">
          <Reveal className="mb-12">
            <span className="eyebrow text-brand">
              <span className="divider-accent" />
              {subServiceEyebrow}
            </span>
            <h2 className="mt-2 text-h2 font-semibold text-foreground">{name}</h2>
          </Reveal>

          <div className="space-y-16 lg:space-y-24">
            {subServices.map((sub, i) => {
              const reversed = i % 2 === 1;
              return (
                <Reveal key={sub.label} delay={i * 60}>
                  <div
                    id={`sub-${i + 1}`}
                    className="scroll-mt-32 grid items-center gap-10 lg:grid-cols-2"
                  >
                    {sub.image && (
                      <div className={cn('relative', reversed && 'lg:order-2')}>
                        <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-card-border shadow-soft-xl">
                          <Image
                            src={sub.image.src}
                            alt={sub.image.alt}
                            fill
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover transition-transform duration-700 hover:scale-105"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/30 via-transparent to-transparent" />
                          <span className="absolute left-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand/90 font-mono text-sm font-bold text-white backdrop-blur-sm">
                            {String.fromCharCode(65 + i)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className={cn(reversed && 'lg:order-1')}>
                      <span className="font-mono text-sm font-bold text-brand">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      <h3 className="mt-1 text-h3 font-semibold text-foreground">{sub.label}</h3>
                      {sub.description && (
                        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                          {sub.description}
                        </p>
                      )}
                      <ul className="mt-6 space-y-3">
                        {sub.bullets.map((bullet, j) => (
                          <li
                            key={j}
                            className="flex items-start gap-3 text-[15px] leading-relaxed text-foreground"
                          >
                            <CheckCircle2
                              className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand"
                              strokeWidth={1.8}
                            />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {journey && <ServiceJourney config={journey} />}

      {/* Outcomes strip */}
      <section id="outcomes" className="scroll-mt-20 bg-[#2C2C2C] text-white">
        <div className="container-lux section-pad">
          <Reveal>
            <span className="eyebrow eyebrow-on-dark text-center text-brand">
              <span className="divider-accent" />
              Outcomes
            </span>
            <h2 className="mt-2 text-center text-h2 font-semibold">What you walk away with</h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {outcomes.map((outcome, i) => (
                <span
                  key={outcome}
                  className="inline-flex items-center gap-2 rounded-badge border border-white/15 bg-white/[0.06] px-5 py-2.5 text-[15px] font-medium text-white/90 transition-colors hover:border-brand/50 hover:text-brand"
                >
                  <span className="font-mono text-xs text-brand">{String(i + 1).padStart(2, '0')}</span>
                  {outcome}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA section */}
      <section id="get-started" className="scroll-mt-20 section-pad bg-background">
        <div className="container-lux">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-h3 font-semibold text-foreground">Ready to get started?</h2>
              <p className="mt-4 text-muted-foreground">{description}</p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                {primaryCta && (
                  <Button asChild size="lg">
                    <Link href={primaryCta.href}>
                      {primaryCta.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {secondaryCta && (
                  <Button asChild size="lg" variant="ghost">
                    <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                  </Button>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
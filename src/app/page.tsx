import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  LineChart,
  Briefcase,
  ShieldCheck,
  LifeBuoy,
  TrendingUp,
  HeartPulse,
  Award,
} from 'lucide-react';
import { site, capabilities, services, audiences, healthChecks, methodSteps, journeyStages, conversionSteps, networkBenefits } from '@/data/site';
import { Reveal } from '@/components/Reveal';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { MediaBand } from '@/components/MediaBand';
import { BlogInsightsSection } from '@/components/blog/BlogInsightsSection';
import { getBlogPosts } from '@/lib/supabase/queries';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Deni Sawa Partners | Fractional CFO & Business Advisory | Special Situations',
  description:
    'AI-enabled fractional business support helping organisations move from Special Situations to Best-in-Class performance. Take your Business Health Check today.',
  alternates: { canonical: `${site.url}/` },
  openGraph: {
    title: 'Deni Sawa Partners | Fractional CFO & Business Advisory',
    description: site.description,
    url: site.url,
    type: 'website',
    siteName: site.name,
  },
};

const serviceIcons = {
  'fractional-cfo': LineChart,
  'fractional-ceo': Briefcase,
  'governance-controls': ShieldCheck,
  'special-situations': LifeBuoy,
} as const;

export default async function HomePage() {
  // Featured articles first, falling back to the most recent if none are featured yet.
  let insights = await getBlogPosts({ featuredOnly: true, limit: 3 });
  if (insights.length === 0) {
    insights = await getBlogPosts({ limit: 3 });
  }

  return (
    <>
      {/* ── 1. Hero ─────────────────────────────────────────── */}
      <section className="hero-pattern relative overflow-hidden bg-charcoal text-white">
        <div className="container-lux section-pad">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div className="max-w-4xl">
              <Reveal>
                <span className="eyebrow mb-6 items-start gap-2 text-brand">
                  <span className="divider-accent" />
                  Special Situations → Best-in-Class
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="hero-display text-h1">
                  From Special Situations to{' '}
                  <span className="text-brand-gradient">Best-in-Class</span>
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
                  AI-enabled advisory and fractional business support helping organisations recover,
                  stabilise, grow and perform at their best.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Button asChild size="lg">
                    <Link href="/health-checks">
                      Start Your Assessment
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="ghost">
                    <Link href="/deni-sawa-method">How We Work</Link>
                  </Button>
                </div>
              </Reveal>
              <Reveal delay={320}>
                <div className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                  <span>Serving</span>
                  <span className="text-white/80">Professionals</span>
                  <span className="h-3 w-px bg-white/20" />
                  <span className="text-white/80">Entrepreneurs</span>
                  <span className="h-3 w-px bg-white/20" />
                  <span className="text-white/80">Investors</span>
                </div>
              </Reveal>
            </div>

            {/* Hero image — full-width after the text on small screens; starts at the centre of the page on large screens */}
            <Reveal delay={200} className="relative lg:absolute lg:inset-y-0 lg:left-1/2 lg:right-0">
              <div className="absolute -right-6 top-10 h-36 w-36 rounded-full border border-brand/25" />
              <div className="absolute -bottom-5 -left-5 h-28 w-28 rounded-lg bg-growth/10" />

              <div className="relative aspect-[3/2] lg:aspect-auto lg:h-full lg:w-full">
                <Image
                  src="/images/hero-1.webp"
                  alt="Deni Sawa Partners concluding a business advisory agreement"
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
                {/* Subtle smooth fade from the left edge so the image blends into the hero */}
                {/* inset-y-0 left-0 w-[250px] bg-gradient-to-r from-charcoal to-transparent */}
                <div className="absolute mt-15" />
                {/* Soft bottom vignette keeps the floating card readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-charcoal/25" />
              </div>

              {/* Floating Health Score card */}
              <div className="absolute bottom-4 left-4 lg:-left-10 lg:bottom-10 w-72 rounded-xl border border-white/10 bg-charcoal/90 p-5 shadow-2xl shadow-black/40 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-brand">Business Health Score</p>
                  <span className="rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-charcoal">
                    AI
                  </span>
                </div>

                <div className="mt-3 flex items-end gap-1.5">
                  <span className="font-display text-5xl font-bold leading-none text-brand">72</span>
                  <span className="mb-1 text-sm text-growth">/100</span>
                  <span className="ml-auto mb-0.5 inline-flex items-center gap-1 rounded-full bg-growth/15 px-2 py-0.5 text-[10px] font-semibold text-growth">
                    <TrendingUp className="h-3 w-3" /> Improving
                  </span>
                </div>

                {/* Gauge */}
                <div className="relative mt-4 h-2 w-full rounded-full bg-white/10">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-brand to-growth" />
                  <span
                    className="absolute -top-[3px] h-4 w-1 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                    style={{ left: '72%' }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-wider text-charcoal">
                  <span>Fragile</span>
                  <span>Stable</span>
                  <span>Resilient</span>
                </div>

                <Link
                  href="/health-checks"
                  className="mt-4 flex items-center justify-between rounded-lg border border-brand/30 bg-brand/10 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:border-brand/50 hover:bg-brand/20"
                >
                  Free AI Diagnostic
                  <ArrowRight className="h-3.5 w-3.5 text-brand" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 2. Capability Strip ─────────────────────────────── */}
      <section className="border-b border-card-border bg-background">
        <div className="container-lux py-8">
          <Reveal className="flex flex-wrap items-center justify-center gap-3">
            {capabilities.map((cap) => (
              <span
                key={cap}
                className="rounded-badge border border-card-border bg-bgalt px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand/40 hover:text-brand"
              >
                {cap}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── 3. Core Service ─────────────────────────────────── */}
      <section className="section-pad bg-background">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Fractional / Part-Time Business Support"
            title="Senior-level expertise. Part-time commitment. Full-time impact."
            subtitle="A seasoned operating bench for organisations that need boardroom capability without boardroom payroll."
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {services
              .filter((s) => s.slug !== 'growth-support')
              .map((service, i) => {
                const Icon = serviceIcons[service.slug as keyof typeof serviceIcons] ?? Briefcase;
                return (
                  <Reveal key={service.slug} delay={i * 80} className="h-full">
                    <Link
                      href={`/business-support/${service.slug}`}
                      className="card-elevated group flex h-full flex-col"
                    >
                      <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                        <Icon className="h-6 w-6" strokeWidth={1.8} />
                      </span>
                      <h3 className="text-h3 font-semibold text-foreground">{service.title.split(' / ')[0]}</h3>
                      <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">{service.short}</p>
                      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-growth transition-colors group-hover:text-growth-600">
                        Learn More
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
          </div>
        </div>
      </section>

      {/* ── 4. Who We Serve ─────────────────────────────────── */}
      <section className="section-pad bg-bgalt">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Who We Serve"
            title="One firm. Three pathways. One standard."
            subtitle="Every engagement starts with clarity about where you are and what success looks like."
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {audiences.map((audience, i) => (
              <Reveal key={audience.title} delay={i * 80} className="h-full">
                <div className="card-elevated flex h-full flex-col overflow-hidden p-0">
                  <div
                    className={cn(
                      'h-1.5 w-full',
                      audience.accent === 'brand' ? 'bg-brand' : 'bg-growth'
                    )}
                  />
                  <div className="flex flex-1 flex-col p-8">
                    <h3 className="text-h3 font-semibold text-foreground">{audience.title}</h3>
                    <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {audience.journey}
                    </p>
                    <p className="mt-4 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                      {audience.description}
                    </p>
                    <Link
                      href={audience.href}
                      className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-600"
                    >
                      {audience.cta}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Photography band */}
      <MediaBand
        src="/images/hero-3.jpg"
        alt="Deni Sawa Partners leadership in session"
        caption="Recovery → Resilience → Growth → Best-in-Class"
        height="md"
      />

      {/* ── 5. Health Check Entry ───────────────────────────── */}
      <section className="hero-pattern section-pad bg-navy text-white">
        <div className="container-lux">
          <SectionHeading
            dark
            eyebrow="Health Checks"
            title="Where Are You Right Now?"
            subtitle="Two AI-powered assessments. A diagnostic report with prioritised recommendations. Start free, in minutes."
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[healthChecks.business, healthChecks.professional].map((check, i) => (
              <Reveal key={check.slug} delay={i * 80} className="h-full">
                <div className="card-dark-panel flex h-full flex-col">
                  <h3 className="text-h3 font-semibold text-white">{check.title}</h3>
                  <p className="mt-3 flex-1 leading-relaxed text-white/65">{check.subtitle}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {check.areas.map((area) => (
                      <span
                        key={area}
                        className="rounded-badge border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                  <div className="mt-8">
                    <Button asChild size="lg">
                      <Link href={`/health-checks/${check.slug}-health-check`}>
                        Start Assessment
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Deni Sawa Method™ ────────────────────────────── */}
      <section className="section-pad bg-background">
        <div className="container-lux">
          <SectionHeading
            eyebrow="The Method"
            title="The Deni Sawa Method™"
            subtitle="Five disciplines, applied in sequence, that move organisations from instability to sustained best-in-class performance."
          />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
            {methodSteps.map((step, i) => (
              <Reveal key={step.letter} delay={i * 80} className="flex flex-1 flex-col items-center">
                <div className="relative flex w-full flex-col items-center text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand text-2xl font-bold text-brand">
                    {step.letter}
                  </span>
                  {/* Connector arrow (desktop only) */}
                  {i < methodSteps.length - 1 && (
                    <ArrowRight className="absolute -right-4 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-brand/60 lg:block" />
                  )}
                  <h3 className="mt-5 text-lg font-semibold text-growth">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-12 text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/deni-sawa-method">
                Explore the Method
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ── 7. Transformation Journey ───────────────────────── */}
      <section className="section-pad bg-bgalt">
        <div className="container-lux">
          <SectionHeading
            eyebrow="The Journey"
            title="Recovery → Resilience → Growth → Best-in-Class"
            subtitle="We do not promise overnight transformation. We build it in stages that compound."
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {journeyStages.map((stage, i) => (
              <Reveal key={stage.stage} delay={i * 80} className="h-full">
                <div className="card-elevated flex h-full flex-col">
                  <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-growth/10 text-growth">
                    {stage.icon === 'HeartPulse' && <HeartPulse className="h-6 w-6" strokeWidth={1.8} />}
                    {stage.icon === 'Shield' && <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />}
                    {stage.icon === 'TrendingUp' && <TrendingUp className="h-6 w-6" strokeWidth={1.8} />}
                    {stage.icon === 'Award' && <Award className="h-6 w-6" strokeWidth={1.8} />}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">{stage.stage}</h3>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">{stage.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Blog Insights ───────────────────────────────── */}
      <BlogInsightsSection
        eyebrow="Blog insights"
        title="Recent featured articles"
        subtitle="Guides, frameworks and practical financial tips from the Deni Sawa advisory team."
        posts={insights}
        viewAllHref="/about/blog"
        viewAllLabel="Visit the blog"
      />

      {/* ── 9. SpecialSit Network Teaser ─────────────────────── */}
      <section className="hero-pattern section-pad bg-charcoal text-white">
        <div className="container-lux grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="eyebrow mb-5 items-start gap-2 text-brand">
                <span className="divider-accent" />
                The SpecialSit Network (SS-N)
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="text-h2 font-semibold text-white">
                The relationship layer of the Deni Sawa ecosystem
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/65">
                A curated peer community for founders, professionals and investors navigating complex
                situations. Not another consulting service — a place to exchange, learn and be held
                accountable.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <ul className="mt-8 space-y-3">
                {networkBenefits.slice(0, 3).map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-white/80">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-growth" />
                    <span className="text-[15px] leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-9">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/specialsit-network">
                    Join the Network
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal direction="left" delay={120}>
            <div className="card-dark-panel">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-brand">The Deni Sawa view · By invitation</p>
              <p className="mt-4 font-display text-3xl leading-snug text-white">
                The best operators don't go it alone. They plug into a community that holds them to a higher
                standard.
              </p>
              <p className="mt-6 text-sm text-white/50">
                A curated peer network for founders, professionals and investors navigating complex situations.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 10. Conversion Journey Strip ──────────────────────── */}
      <section className="bg-brand text-white">
        <div className="container-lux section-pad">
          <Reveal className="mb-10 text-center">
            <h2 className="text-h2 font-semibold text-white">The Path to Transformation</h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
            {conversionSteps.map((step, i) => (
              <Reveal key={step.step} delay={i * 60} className="relative">
                <span className="font-mono text-sm font-bold text-white/60">{step.step}</span>
                <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/80">{step.description}</p>
                {i < conversionSteps.length - 1 && (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-white/50 lg:block" />
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. Final CTA ────────────────────────────────────── */}
      <CTASection />
    </>
  );
}

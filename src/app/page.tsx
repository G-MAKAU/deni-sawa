import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Check,
  LineChart,
  Briefcase,
  ShieldCheck,
  LifeBuoy,
  TrendingUp,
} from 'lucide-react';
import { site, capabilities, services, audiences, healthChecks, conversionSteps, networkBenefits } from '@/data/site';
import { Reveal } from '@/components/Reveal';
import { HealthScoreCard } from '@/components/HealthScoreCard';
import { AudienceRouter } from '@/components/AudienceRouter';
import { MethodSignature } from '@/components/MethodSignature';
import { JourneyProgression } from '@/components/JourneyProgression';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { MediaBand } from '@/components/MediaBand';
import { BlogInsightsSection } from '@/components/blog/BlogInsightsSection';
import { getBlogPosts } from '@/lib/supabase/queries';
import { Button } from '@/components/ui/button';

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
  'growth-support': TrendingUp,
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

            {/* Business Health Score card — between the top content and the image on
                small screens so the image stays fully visible; floats over the image
                on large screens */}
            <div className="relative lg:absolute lg:bottom-10 lg:left-1/2 lg:-ml-10 lg:z-20">
              <HealthScoreCard />
            </div>

            {/* Hero image — full-width after the text on small screens; starts at the centre of the page on large screens */}
            <Reveal delay={200} className="relative lg:absolute lg:inset-y-0 lg:left-1/2 lg:right-0">
              <div className="absolute -right-6 top-10 h-36 w-36 rounded-full border border-brand/25" />
              <div className="absolute -bottom-5 -left-5 h-28 w-28 rounded-lg bg-growth/10" />

              <div className="relative aspect-[3/2] lg:aspect-auto lg:h-full lg:w-full">
                <Image
                  src="/images/hero-1.jpg"
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
                {/* Caption — bottom right, matching MediaBand caption style */}
                <div className="absolute bottom-0 right-0 bg-navy">
                  <div className="px-5 py-3 sm:px-8">
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                      Advisory · Governance · Capital
                    </p>
                  </div>
                </div>
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

          {/* Featured — Growth & Business Development */}
          <Reveal className="h-full">
            {(() => {
              const featured = services.find((s) => s.slug === 'growth-support')!;
              const FeaturedIcon = TrendingUp;
              return (
                <Link
                  href={`/business-support/${featured.slug}`}
                  className="card-elevated group relative flex flex-col overflow-hidden p-0 lg:flex-row"
                >
                  <div className="flex flex-1 flex-col p-8 lg:p-10">
                    <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-growth/10 text-growth transition-colors group-hover:bg-growth group-hover:text-white">
                      <FeaturedIcon className="h-6 w-6" strokeWidth={1.8} />
                    </span>
                    <h3 className="text-h2 font-semibold text-foreground">
                      {featured.title.split(' / ')[0]}
                    </h3>
                    <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                      {featured.short}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {featured.capabilities.slice(0, 3).map((cap) => (
                        <span
                          key={cap}
                          className="rounded-badge border border-card-border bg-bgalt px-3 py-1 text-xs text-foreground"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                    <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-growth transition-colors group-hover:text-growth-600">
                      Explore Growth & Business Development
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                  <div className="flex items-center bg-gradient-to-br from-growth/10 to-brand/10 p-8 lg:w-80 lg:p-10">
                    <div className="rounded-xl border border-card-border bg-card p-6 shadow-lg">
                      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Growth Path
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-foreground">
                        Revenue optimisation, business model review, strategic partnerships and
                        investor readiness — a deliberate path to sustainable expansion.
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })()}
          </Reveal>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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

          <AudienceRouter audiences={audiences} />
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
                <div className="card-dark-panel card-dark-panel--consistent flex h-full flex-col">
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

          <MethodSignature />

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

          <JourneyProgression />
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

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
  GraduationCap,
  Users,
  Network,
} from 'lucide-react';
import { site, services, audiences, healthChecks, networkBenefits } from '@/data/site';
import { getActiveHealthChecks } from '@/lib/health-checks';
import { stats, testimonials } from '@/data/content';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/Reveal';
import { HealthScoreCard } from '@/components/HealthScoreCard';
import { AudienceRouter } from '@/components/AudienceRouter';
import { MethodSignature } from '@/components/MethodSignature';
import { JourneyProgression } from '@/components/JourneyProgression';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { MediaBand } from '@/components/MediaBand';
import { EditorialRow } from '@/components/EditorialRow';
import { StatBand } from '@/components/StatBand';
import { PullQuote } from '@/components/PullQuote';
import { BlogCoverImage } from '@/components/blog/BlogCoverImage';
import { HomepageSectionNav } from '@/components/homepage/HomepageSectionNav';
import { getBlogPosts } from '@/lib/supabase/queries';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Deni Sawa Partners | Fractional CFO & Business Advisory | Special Situations',
  description:
    'Senior-level fractional business support helping organisations move from Special Situations to Best-in-Class performance. Take your Business Health Check today.',
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

  // Assessment cards reflect every active health check in the system,
  // falling back to the two canonical checks if the database is unreachable.
  const activeChecks = await getActiveHealthChecks();
  const checkCards =
    activeChecks.length > 0
      ? activeChecks.map((c) => ({
          slug: c.slug,
          title: c.title,
          subtitle: c.description,
          areas: c.tags,
        }))
      : [
          {
            slug: `${healthChecks.business.slug}-health-check`,
            title: healthChecks.business.title,
            subtitle: healthChecks.business.subtitle,
            areas: healthChecks.business.areas,
          },
          {
            slug: `${healthChecks.professional.slug}-health-check`,
            title: healthChecks.professional.title,
            subtitle: healthChecks.professional.subtitle,
            areas: healthChecks.professional.areas,
          },
        ];

  return (
    <>
      {/* ── 01. Hero ────────────────────────────────────────── */}
      <section id="overview" className="hero-pattern relative overflow-hidden bg-charcoal text-white scroll-mt-20">
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
                  Senior advisors and fractional executives helping organisations recover,
                  stabilise, grow and perform at their best.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Button asChild size="lg">
                    <Link href="/health-checks#choose-your-assessment">
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
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-charcoal/25" />
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

      {/* ── 02. Choose Your Situation ───────────────────────── */}
      <HomepageSectionNav />
      <section id="who-we-serve" className="section-pad bg-bgalt scroll-mt-20">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Choose Your Situation"
            title="Individual · Business · Investor"
            subtitle="Every engagement starts with clarity about where you are and what success looks like."
          />

          <AudienceRouter audiences={audiences} />
        </div>
      </section>

      {/* ── 03. Diagnose ─────────────────────────────────────── */}
      <section id="health-checks" className="hero-pattern section-pad bg-navy text-white scroll-mt-20">
        <div className="container-lux">
          <SectionHeading
            dark
            eyebrow="Diagnose"
            title="Your Health Check"
            subtitle="Structured assessments. A prioritised diagnostic report — used by our advisors as the foundation for your first conversation. Start free, in minutes."
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {checkCards.map((check, i) => (
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
                      <Link href={`/health-checks/${check.slug}`}>
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

      {/* ── 04. Your Journey ─────────────────────────────────── */}
      <section id="the-journey" className="section-pad bg-background scroll-mt-20">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Your Journey"
            title="Recovery → Resilience → Growth → Best-in-Class"
            subtitle="We do not promise overnight transformation. We build it in stages that compound."
          />

          <JourneyProgression />
        </div>
      </section>

      {/* Photography band */}
      <MediaBand
        src="/images/hero-3.jpg"
        alt="Deni Sawa Partners leadership in session"
        caption="Recovery → Resilience → Growth → Best-in-Class"
        height="md"
      />

      {/* ── 05. How We Help ──────────────────────────────────── */}
      <section id="services" className="section-pad bg-bgalt scroll-mt-20">
        <div className="container-lux">
          <SectionHeading
            eyebrow="How We Help"
            title="Fractional CFO · CEO · Governance · Growth · Special Situations"
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
                          className="rounded-badge border border-card-border bg-background px-3 py-1 text-xs text-foreground"
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

          <div className="mt-10">
            {services
              .filter((s) => s.slug !== 'growth-support')
              .map((service, i) => {
                const Icon = serviceIcons[service.slug as keyof typeof serviceIcons] ?? Briefcase;
                return (
                  <Reveal key={service.slug} delay={i * 60}>
                    <EditorialRow
                      index={String(i + 1).padStart(2, '0')}
                      title={service.title.split(' / ')[0]}
                      description={service.short}
                      href={`/business-support/${service.slug}`}
                      cta="Explore Service"
                      icon={Icon}
                      last={i === services.length - 2}
                    />
                  </Reveal>
                );
              })}
          </div>
        </div>
      </section>

      {/* ── 06. The Deni Sawa Method™ ────────────────────────── */}
      <section id="the-method" className="section-pad bg-background scroll-mt-20">
        <div className="container-lux">
          <SectionHeading
            eyebrow="The Method"
            title="The Deni Sawa Method™"
            subtitle="Diagnose → Evaluate → Negotiate → Implement → Sustain. Five disciplines that move organisations from instability to sustained best-in-class performance."
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

      {/* ── 07. Proof ────────────────────────────────────────── */}
      <section className="hero-pattern section-pad bg-charcoal text-white">
        <div className="container-lux">
          <SectionHeading
            dark
            eyebrow="Proof"
            title="Experience · Results · Case Studies"
            subtitle="A track record built in banking, finance, risk and restructuring — applied to the situations our clients face."
          />

          {/* Stats */}
          <StatBand stats={stats} dark />

          {/* Testimonial */}
          <Reveal className="mt-16">
            <PullQuote
              quote={testimonials[0].quote}
              author={testimonials[0].author}
              role={testimonials[0].role}
              dark
            />
          </Reveal>

          <Reveal className="mt-12 text-center">
            <Button asChild size="lg" variant="ghost">
              <Link href="/about/experience">
                View Our Track Record & Credentials
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ── 08. Ecosystem ────────────────────────────────────── */}
      <section id="the-network" className="section-pad bg-bgalt scroll-mt-20">
        <div className="container-lux">
          <SectionHeading
            eyebrow="The Ecosystem"
            title="Learning · Mentorship · SpecialSit Network"
            subtitle="Everything we offer sits inside one connected ecosystem — learn the capability, then be held accountable by peers and operators."
          />

          <div>
            {[
              {
                index: '01',
                icon: GraduationCap,
                title: 'Learning Centre',
                description: 'Self-paced programmes and pathways that build recovery, governance and financial-resilience capability.',
                href: '/learning',
                cta: 'Explore Learning',
              },
              {
                index: '02',
                icon: Users,
                title: 'Mentorship',
                description: 'Direct access to seasoned bankers, operators and turnaround professionals who have lived these situations.',
                href: '/specialsit-network',
                cta: 'Find a Mentor',
              },
              {
                index: '03',
                icon: Network,
                title: 'SpecialSit Network',
                description: 'A curated peer community for founders, professionals and investors navigating complex situations.',
                href: '/specialsit-network',
                cta: 'Join the Network',
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <EditorialRow
                  index={item.index}
                  title={item.title}
                  description={item.description}
                  href={item.href}
                  cta={item.cta}
                  icon={item.icon}
                  last={i === 2}
                />
              </Reveal>
            ))}
          </div>

          <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <ul className="space-y-3">
                {networkBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-muted-foreground">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-growth" />
                    <span className="text-[15px] leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal direction="left" delay={120}>
              <div className="hero-pattern rounded-lg bg-navy p-8 text-white">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-brand">The Deni Sawa view · By invitation</p>
                <p className="mt-4 font-display text-3xl leading-snug text-white">
                  The best operators don't go it alone. They plug into a community that holds them to a higher
                  standard.
                </p>
                <div className="mt-7">
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/specialsit-network">
                      Join the Network
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 09. Intelligence ─────────────────────────────────── */}
      <section id="insights" className="section-pad bg-background scroll-mt-20">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Intelligence"
            title="Insights"
            subtitle="Guides, frameworks and practical financial notes from the Deni Sawa advisory team."
          />

          {insights[0] && (
            <Reveal>
              <Link
                href={`/about/blog/${insights[0].slug}`}
                className="group grid overflow-hidden rounded-lg border border-card-border lg:grid-cols-2"
              >
                <div className="relative overflow-hidden">
                  <BlogCoverImage
                    src={insights[0].cover_image_url}
                    alt={insights[0].title}
                    className="aspect-video h-full"
                    fallbackTextSize="text-6xl"
                  />
                </div>
                <div className="flex flex-col justify-center p-8 lg:p-10">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                    {insights[0].primary_category ?? 'General'}
                  </span>
                  <h3 className="mt-4 text-h2 font-semibold text-foreground transition-colors group-hover:text-brand">
                    {insights[0].title}
                  </h3>
                  {insights[0].excerpt && (
                    <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-muted-foreground">
                      {insights[0].excerpt}
                    </p>
                  )}
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                    Read Article
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          )}

          {insights.slice(1).length > 0 && (
            <div className="mt-10">
              {insights.slice(1).map((post, i) => (
                <Reveal key={post.slug} delay={i * 60}>
                  <Link
                    href={`/about/blog/${post.slug}`}
                    className={cn(
                      'group grid grid-cols-1 items-start gap-3 py-6 md:grid-cols-[1fr_auto] md:items-center',
                      i < insights.slice(1).length - 1 && 'border-b border-card-border'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="text-h3 font-semibold text-foreground transition-colors group-hover:text-brand">
                          {post.title}
                        </h3>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {post.primary_category ?? 'General'}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 justify-self-start text-sm font-semibold text-brand md:justify-self-end">
                      Read
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}

          <Reveal className="mt-12 text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/about/blog">
                Visit the Blog
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ── 10. CTA ──────────────────────────────────────────── */}
      <div id="get-started" className="scroll-mt-20">
        <CTASection
          title="Find Your Starting Point"
          subtitle="Take the first step. One conversation can change the direction of your business."
          primary={{ label: 'Start Your Assessment', href: '/health-checks#choose-your-assessment' }}
          secondary={{ label: 'Book a Clarity Call', href: '/contact' }}
        />
      </div>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Building2, CheckCircle2, Compass, Network, Users } from 'lucide-react';
import { site } from '@/data/site';
import { Reveal } from '@/components/Reveal';
import { Button } from '@/components/ui/button';
import { ServiceJourney } from '@/components/ServiceJourney';

export const metadata: Metadata = {
  title: 'Learning & Programs — Digital Courses, Executive Finance & Mentorship | Deni Sawa',
  description:
    'Structured learning pathways, executive finance programs, and the Deni Sawa Method for building financial, business and leadership capability.',
  alternates: { canonical: `${site.url}/services/learning` },
};

const programs = [
  {
    id: 'lms',
    letter: 'A',
    title: 'Learning Management System (LMS)',
    icon: BookOpen,
    image: { src: '/images/learning-session.jpg', alt: 'Interactive digital learning session' },
    description:
      'The digital learning environment for structured courses, tools, progress tracking and accountability.',
    bullets: [
      'Structured learning pathways',
      'Interactive courses and resources',
      'Assessments and progress tracking',
      'Dashboards and accountability',
      'Certificates where applicable',
    ],
    cta: { label: 'Access the Learning Centre', href: '/lms', note: 'Launching soon' },
  },
  {
    id: 'deni-sawa-method',
    letter: 'B',
    title: 'Deni Sawa Method™',
    icon: Compass,
    image: { src: '/images/method.jpg', alt: 'The Deni Sawa Method' },
    description:
      'A structured approach for moving from pressure and uncertainty toward sustainable performance.',
    bullets: [
      'Diagnose — Understand the real situation',
      'Evaluate — Determine priorities, risks and opportunities',
      'Negotiate — Develop workable solutions',
      'Implement — Turn decisions into disciplined action',
      'Sustain — Embed systems and accountability',
    ],
    cta: { label: 'Explore the Deni Sawa Method', href: '/deni-sawa-method' },
  },
  {
    id: 'executive-finance',
    letter: 'C',
    title: 'Executive Finance & Leadership Programs',
    icon: Building2,
    image: { src: '/images/exec-finance.jpg', alt: 'Executive finance for leaders' },
    description:
      'Practical executive finance for leaders who are not accountants. No accounting background required.',
    bullets: [
      'Understand financial statements and business performance',
      'Make better cashflow and profitability decisions',
      'Use budgets, KPIs and management reports',
      'Strengthen financial controls and governance',
      'Connect finance to leadership and strategy',
    ],
    cta: { label: 'Explore Executive Finance', href: '/contact' },
  },
  {
    id: 'specialsit-network',
    letter: 'D',
    title: 'SpecialSit Network',
    icon: Network,
    image: { src: '/images/network.jpg', alt: 'SpecialSit Network community forum' },
    description:
      'A wider community for entrepreneurs, professionals, investors and strategic partners seeking peer learning, accountability, mentorship and connections.',
    bullets: [
      'Peer learning and shared experience',
      'Accountability circles',
      'Mentorship and coaching',
      'Strategic connections and partnerships',
    ],
    cta: { label: 'Visit the SpecialSit Network', href: '/about/specialsit-network' },
  },
  {
    id: 'other-programs',
    letter: 'E',
    title: 'Other Programs',
    icon: Users,
    image: { src: '/images/learning-hero.jpg', alt: 'Structured learning programs' },
    description:
      'Coming soon — practical programs across the areas that matter most to founders, professionals and investors.',
    bullets: ['Business Recovery', 'Governance', 'Financial Resilience', 'Entrepreneurship & Growth', 'Investor Readiness'],
    cta: { label: 'Discuss a Custom Program', href: '/contact' },
  },
];

export default function LearningPage() {
  return (
    <>
      {/* Back link */}
      <div className="border-b border-card-border bg-card">
        <div className="container-lux flex h-14 items-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
          >
            ← Back to Services
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-charcoal text-white">
        <div className="absolute inset-0">
          <Image
            src="/images/academy-hero.jpg"
            alt="Deni Sawa learning environment"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/90 to-charcoal/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-charcoal/60" />
        </div>
        <div className="container-lux section-pad relative">
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Reveal>
                <span className="mb-6 block font-mono text-[11px] uppercase tracking-[0.2em] text-brand">
                  05 / Services
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="hero-display text-h1 text-white">05</h1>
              </Reveal>
              <Reveal delay={140}>
                <h2 className="text-h2 font-semibold text-white">Learning & Programs</h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="mt-4 text-xl font-medium italic text-green">
                  Learn → Apply → Lead → Transform
                </p>
              </Reveal>
              <Reveal delay={260}>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
                  Practical programmes, digital learning and structured development designed to
                  build financial, business and leadership capability.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Anchor navigation */}
      <section className="sticky top-0 z-30 border-b border-card-border bg-background/95 backdrop-blur-md">
        <div className="container-lux">
          <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto py-3">
            {programs.map((p) => (
              <a
                key={p.id}
                href={`#${p.id}`}
                className="whitespace-nowrap rounded-badge border border-card-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
              >
                {p.title}
              </a>
            ))}
            <a
              href="#get-started"
              className="whitespace-nowrap rounded-badge border border-card-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
            >
              Get Started
            </a>
          </div>
        </div>
      </section>

      {/* Program sections */}
      <section className="section-pad bg-background">
        <div className="container-lux space-y-16 lg:space-y-24">
          {programs.map((p, i) => {
            const Icon = p.icon;
            const reversed = i % 2 === 1;
            return (
              <Reveal key={p.id} delay={i * 60}>
                <div
                  id={p.id}
                  className="scroll-mt-32 grid items-center gap-10 lg:grid-cols-2"
                >
                  <div className={reversed ? 'lg:order-2' : undefined}>
                    <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-card-border shadow-soft-xl">
                      <Image
                        src={p.image.src}
                        alt={p.image.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/30 via-transparent to-transparent" />
                      <span className="absolute left-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand/90 text-white backdrop-blur-sm">
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                      </span>
                    </div>
                  </div>

                  <div className={reversed ? 'lg:order-1' : undefined}>
                    <span className="font-mono text-sm font-bold text-brand">{p.letter}.</span>
                    <h2 className="mt-1 text-h3 font-semibold text-foreground">{p.title}</h2>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                      {p.description}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {p.bullets.map((bullet, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-3 text-[15px] leading-relaxed text-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" strokeWidth={1.8} />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8">
                      <Button asChild className="group">
                        <Link href={p.cta.href}>
                          {p.cta.label}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </Button>
                      {p.cta.note && (
                        <span className="ml-4 text-xs text-muted-foreground">({p.cta.note})</span>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Journey */}
      <ServiceJourney
        config={{
          eyebrow: 'Your Journey',
          title: 'Learn → Apply → Lead → Transform',
          description:
            'A structured learning path that moves you from understanding, to doing, to leading — and ultimately to transformed financial and business outcomes.',
          stages: [
            {
              stage: 'Learn',
              icon: 'GraduationCap',
              description:
                'Build the knowledge and frameworks through structured courses, the Deni Sawa Method and executive programs.',
            },
            {
              stage: 'Apply',
              icon: 'Compass',
              description:
                'Put the learning to work in your real situation — tools, templates, dashboards and practical exercises.',
            },
            {
              stage: 'Lead',
              icon: 'Award',
              description:
                'Develop the leadership and accountability to drive change in your business, career or team.',
            },
            {
              stage: 'Transform',
              icon: 'TrendingUp',
              description:
                'The compounding payoff — sustained improvement in financial health, business performance and leadership capability.',
            },
          ],
        }}
      />

      {/* Outcomes / CTA */}
      <section id="get-started" className="scroll-mt-20 section-pad bg-[#2C2C2C] text-white">
        <div className="container-lux">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-h3 font-semibold">Ready to start learning?</h2>
              <p className="mt-4 text-white/70">
                Explore our learning pathways or get in touch to discuss a custom program for your
                team.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="group">
                  <Link href="/contact">
                    Discuss a Program
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="text-white hover:text-brand">
                  <Link href="/deni-sawa-method">Read About the Method</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Landmark,
  LineChart,
  TrendingUp,
  GraduationCap,
  HeartPulse,
} from 'lucide-react';
import { site } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { EditorialRow } from '@/components/EditorialRow';
import { CTASection } from '@/components/CTASection';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Services & Programmes | Deni Sawa',
  description:
    'Five pathways to financial health: professionals and individuals, entrepreneurs and founders, investors, health checks, and learning.',
  alternates: { canonical: `${site.url}/services` },
  openGraph: {
    title: 'Services & Programmes | Deni Sawa',
    description:
      'Five pathways to financial health: professionals and individuals, entrepreneurs and founders, investors, health checks, and learning.',
    images: ['/images/services-hero.jpg'],
  },
};

const serviceCategories = [
  {
    number: '01',
    name: 'Professionals & Individuals',
    positioningTag: 'Financial Health → Resilience → Leadership',
    description:
      'We help professionals and individuals build greater financial clarity, resilience and confidence.',
    href: '/services/professionals',
    icon: Briefcase,
    accent: 'brand' as const,
  },
  {
    number: '02',
    name: 'Entrepreneurs & Founders',
    positioningTag: 'Stability → Structure → Growth → Best-in-Class',
    description:
      'Our core business support pathway for founders and owners who need stronger financial discipline, governance, execution and growth support.',
    href: '/services/entrepreneurs',
    icon: LineChart,
    accent: 'brand' as const,
  },
  {
    number: '03',
    name: 'Investors',
    positioningTag: 'Visibility → Governance → Accountability → Portfolio Performance',
    description:
      'We support investors seeking stronger visibility, governance and execution discipline across SME and growth-business investments.',
    href: '/services/investors',
    icon: Landmark,
    accent: 'brand' as const,
  },
  {
    number: '04',
    name: 'Business Health Checks',
    positioningTag: 'Know Your Status → Diagnose → Take Action',
    description:
      'Health Checks are the diagnostic entry point into the Deni Sawa ecosystem. Assessment results guide clients toward self-learning, mentorship, advisory or fractional support.',
    href: '/health-checks',
    icon: HeartPulse,
    accent: 'brand' as const,
  },
  {
    number: '05',
    name: 'Learning & Programs',
    positioningTag: 'Learn → Apply → Lead → Transform',
    description:
      'Practical programmes, digital learning and structured development designed to build financial, business and leadership capability.',
    href: '/services/learning',
    icon: GraduationCap,
    accent: 'brand' as const,
  },
];

export default function ServicesHubPage() {
  const featured = serviceCategories[1];

  return (
    <>
      <section id="overview" className="scroll-mt-20">
        <PageHero
          eyebrow="Services"
          title="Five Ways We Can Help"
          subtitle="Three client pathways, one diagnostic platform and one learning ecosystem — structured around where you are and where you need to go."
          crumbs={[{ label: 'Services' }]}
          image={{ src: '/images/services-hero.jpg', alt: 'Deni Sawa Partners advisory team at work' }}
        />
      </section>

      {/* How We Help — editorial listing, matching the homepage */}
      <section id="services-list" className="section-pad bg-background scroll-mt-20">
        <div className="container-lux">
          <SectionHeading
            eyebrow="How We Help"
            title="Fractional CFO · CEO · Governance · Growth · Special Situations"
            subtitle="A seasoned operating bench for organisations that need boardroom capability without boardroom payroll."
          />

          {/* Featured — Entrepreneurs & Founders */}
          <Reveal className="h-full">
            {(() => {
              const FeaturedIcon = featured.icon;
              return (
                <Link
                  href={featured.href}
                  className="card-elevated group relative flex flex-col overflow-hidden p-0 lg:flex-row"
                >
                  <div className="flex flex-1 flex-col p-8 lg:p-10">
                    <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                      <FeaturedIcon className="h-6 w-6" strokeWidth={1.8} />
                    </span>
                    <h3 className="text-h2 font-semibold text-foreground">{featured.name}</h3>
                    <p className="mt-2 text-base font-medium italic text-green">
                      {featured.positioningTag}
                    </p>
                    <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                      {featured.description}
                    </p>
                    <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors group-hover:text-brand-600">
                      Explore {featured.name}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                  <div className="flex items-center bg-gradient-to-br from-brand/10 to-growth/10 p-8 lg:w-80 lg:p-10">
                    <div className="rounded-xl border border-card-border bg-card p-6 shadow-lg">
                      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Growth Path
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-foreground">
                        Stability → Structure → Growth → Best-in-Class — a deliberate path for
                        founders who want to build a business that works without them in the room.
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })()}
          </Reveal>

          {/* Editorial rows for the remaining services */}
          <div className="mt-10">
            {serviceCategories
              .filter((c) => c.href !== featured.href)
              .map((category, i) => {
                const Icon = category.icon;
                return (
                  <Reveal key={category.href} delay={i * 60}>
                    <EditorialRow
                      index={String(i + 1).padStart(2, '0')}
                      title={category.name}
                      description={category.description}
                      href={category.href}
                      cta="Explore Service"
                      icon={Icon}
                      accent={category.accent}
                      last={i === serviceCategories.length - 2}
                    />
                  </Reveal>
                );
              })}
          </div>
        </div>
      </section>

      <CTASection
        title="Not sure which service fits?"
        subtitle="Start with a confidential Health Check — a diagnostic report will show you exactly where attention is needed."
      />
    </>
  );
}
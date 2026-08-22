import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Landmark,
  LineChart,
  GraduationCap,
  HeartPulse,
} from 'lucide-react';
import { site } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { Reveal } from '@/components/Reveal';
import { cn } from '@/lib/utils';
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd';

export const metadata: Metadata = {
  title: 'Services & Programmes — Financial Advisory | Deni Sawa Partners',
  description:
    'Explore five structured pathways to financial health: Professionals & Individuals, Entrepreneurs & Founders, Investors, Business Health Checks, and Learning & Programs. Senior-level advisory from Deni Sawa Partners.',
  keywords: [
    'financial advisory Kenya',
    'fractional CFO Nairobi',
    'business health check',
    'entrepreneur financial support',
    'investor governance',
    'financial coaching Kenya',
    'business support services',
  ],
  alternates: { canonical: `${site.url}/services` },
  openGraph: {
    title: 'Services & Programmes — Financial Advisory | Deni Sawa Partners',
    description:
      'Five structured pathways to financial health: professionals, entrepreneurs, investors, health checks, and learning.',
    url: `${site.url}/services`,
    siteName: site.name,
    images: [{ url: '/images/hero-services.webp', width: 1200, height: 630, alt: 'Deni Sawa Partners services' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Services & Programmes — Deni Sawa Partners',
    description: 'Five structured pathways to financial health.',
    images: ['/images/hero-services.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

interface ServiceStep {
  label: string;
  description: string;
}

interface ServiceCategory {
  number: string;
  name: string;
  tagline: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  steps: ServiceStep[];
  capabilities: string[];
}

const serviceCategories: ServiceCategory[] = [
  {
    number: '01',
    name: 'Professionals & Individuals',
    tagline: 'Financial Health → Resilience → Leadership',
    description:
      'We help professionals and individuals build greater financial clarity, resilience and confidence — so personal finances become a foundation for professional performance.',
    href: '/services/professionals',
    icon: Briefcase,
    steps: [
      { label: 'Financial Health', description: 'Assessment and a clear picture of where you stand.' },
      { label: 'Resilience', description: 'Build buffers, reduce risk and strengthen your position.' },
      { label: 'Leadership', description: 'Lead with clarity, confidence and financial discipline.' },
    ],
    capabilities: [
      'Personal financial health assessment',
      'Debt review and restructuring guidance',
      'Cashflow and budgeting frameworks',
      'Emergency fund and resilience planning',
      'Executive financial coaching',
    ],
  },
  {
    number: '02',
    name: 'Entrepreneurs & Founders',
    tagline: 'Stability → Structure → Growth → Best-in-Class',
    description:
      'Our core business support pathway for founders and owners who need stronger financial discipline, governance, execution and growth support.',
    href: '/services/entrepreneurs',
    icon: LineChart,
    steps: [
      { label: 'Stability', description: 'Stop the fires. Stabilise cashflow and operations.' },
      { label: 'Structure', description: 'Build the systems, reporting and governance.' },
      { label: 'Growth', description: 'Scale with discipline and execution excellence.' },
      { label: 'Best-in-Class', description: 'Reach top-tier performance and market position.' },
    ],
    capabilities: [
      'Fractional CFO and financial leadership',
      'Strategic planning and execution support',
      'Governance and board readiness',
      'Cashflow management and forecasting',
      'Growth strategy and implementation',
    ],
  },
  {
    number: '03',
    name: 'Investors',
    tagline: 'Visibility → Governance → Accountability → Portfolio Performance',
    description:
      'We support investors seeking stronger visibility, governance and execution discipline across SME and growth-business investments.',
    href: '/services/investors',
    icon: Landmark,
    steps: [
      { label: 'Visibility', description: 'Know what is happening across your portfolio.' },
      { label: 'Governance', description: 'Establish reporting, controls and oversight.' },
      { label: 'Accountability', description: 'Drive performance with clear targets and review.' },
      { label: 'Portfolio Performance', description: 'Optimise returns and value creation.' },
    ],
    capabilities: [
      'Portfolio financial monitoring',
      'Investor reporting and dashboards',
      'Board and governance advisory',
      'Due diligence and value creation support',
      'Restructuring and turnaround advisory',
    ],
  },
  {
    number: '04',
    name: 'Business Health Checks',
    tagline: 'Know Your Status → Diagnose → Take Action',
    description:
      'Health Checks are the diagnostic entry point into the Deni Sawa ecosystem. Assessment results guide clients toward self-learning, mentorship, advisory or fractional support.',
    href: '/business-health-checks',
    icon: HeartPulse,
    steps: [
      { label: 'Know Your Status', description: 'Complete a structured diagnostic assessment.' },
      { label: 'Diagnose', description: 'Receive a detailed report on your financial health.' },
      { label: 'Take Action', description: 'Get a clear roadmap for your next steps.' },
    ],
    capabilities: [
      'Business financial health check',
      'Professional financial health check',
      'Detailed diagnostic reports',
      'AI-powered analysis and recommendations',
      'Personalised action pathways',
    ],
  },
  {
    number: '05',
    name: 'Learning & Programs',
    tagline: 'Learn → Apply → Lead → Transform',
    description:
      'Practical programmes, digital learning and structured development designed to build financial, business and leadership capability.',
    href: '/services/learning',
    icon: GraduationCap,
    steps: [
      { label: 'Learn', description: 'Build foundational knowledge and skills.' },
      { label: 'Apply', description: 'Put learning into practice with guided exercises.' },
      { label: 'Lead', description: 'Develop leadership and decision-making capability.' },
      { label: 'Transform', description: 'Achieve measurable change in performance.' },
    ],
    capabilities: [
      'Self-paced digital learning',
      'Financial literacy programmes',
      'Leadership development',
      'Mentorship and coaching',
      'Certification and credentials',
    ],
  },
];

function ServiceSteps({ steps, accent }: { steps: ServiceStep[]; accent: 'brand' | 'growth' }) {
  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold',
              accent === 'brand'
                ? 'border-brand/30 bg-brand/10 text-brand'
                : 'border-growth/30 bg-growth/10 text-growth'
            )}
          >
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{step.label}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ServiceJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Deni Sawa Partners — Services & Programmes',
    description: 'Five structured pathways to financial health for professionals, entrepreneurs, and investors.',
    url: `${site.url}/services`,
    itemListElement: serviceCategories.map((cat, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: cat.name,
        description: cat.description,
        url: `${site.url}${cat.href}`,
        provider: {
          '@type': 'Organization',
          name: site.name,
          url: site.url,
        },
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function ServicesHubPage() {
  return (
    <>
      <ServiceJsonLd />
      <BreadcrumbJsonLd items={[{ label: 'Home', href: '/' }, { label: 'Services' }]} />

      <section id="overview" className="scroll-mt-20">
        <PageHero
          eyebrow="Services"
          title="Five Pathways to Best-in-Class"
          subtitle="Three client pathways, one diagnostic platform and one learning ecosystem — structured around where you are and where you need to go."
          crumbs={[{ label: 'Services' }]}
          image={{ src: '/images/hero-services.webp', alt: 'Modern business district representing premium advisory services' }}
        />
      </section>

      {/* Service pathways */}
      <section id="services-list" className="section-pad bg-background scroll-mt-20">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Our Pathways"
            title="Structured Around Your Stage"
            subtitle="Each pathway is designed for a specific client profile, with a clear progression from entry to impact."
          />

          <div className="space-y-6">
            {serviceCategories.map((category, idx) => {
              const Icon = category.icon;
              return (
                <Reveal key={category.href} delay={idx * 60}>
                  <Link
                    href={category.href}
                    className="card-elevated group relative flex flex-col overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg lg:flex-row"
                  >
                    {/* Left: info */}
                    <div className="flex flex-1 flex-col p-8 lg:p-10">
                      <div className="mb-5 flex items-center gap-3">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                          <Icon className="h-6 w-6" strokeWidth={1.8} />
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                          {category.number}
                        </span>
                      </div>
                      <h3 className="text-h2 font-semibold text-foreground">{category.name}</h3>
                      <p className="mt-2 text-sm font-semibold italic text-green">{category.tagline}</p>
                      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                        {category.description}
                      </p>
                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        {category.steps.map((step) => (
                          <span
                            key={step.label}
                            className="rounded-full border border-card-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
                          >
                            {step.label}
                          </span>
                        ))}
                      </div>
                      <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors group-hover:text-brand-600">
                        Explore {category.name}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>

                    {/* Right: steps panel */}
                    <div className="flex items-center bg-gradient-to-br from-brand/10 to-growth/10 p-8 lg:w-80 lg:p-10">
                      <div className="rounded-xl border border-card-border bg-card p-6 shadow-lg">
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Pathway Steps
                        </p>
                        <div className="mt-4">
                          <ServiceSteps steps={category.steps} accent="brand" />
                        </div>
                      </div>
                    </div>
                  </Link>
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

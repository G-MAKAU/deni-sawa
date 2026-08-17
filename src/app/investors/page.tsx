import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Eye, Scale, Handshake, Rocket, TrendingUp } from 'lucide-react';
import { site, investorServices, investorCapabilities } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { MediaBand } from '@/components/MediaBand';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Investors & Portfolio Oversight | Deni Sawa',
  description:
    'Independent, outsourced investor support — readiness, portfolio oversight, governance monitoring and representation — for investors who take governance seriously.',
  alternates: { canonical: `${site.url}/investors` },
};

const icons = {
  Rocket,
  Eye,
  Scale,
  Handshake,
} as const;

const investorPages = {
  'investor-readiness': {
    title: 'Investor Readiness',
    positioning: 'Preparing founders and businesses for investment — clean financials, governance and a credible story that stands up to due diligence.',
    outcomes: [
      'A credible, investor-grade data room',
      'Clean financials and realistic forecasts',
      'A governance posture that passes diligence',
      'A founder story that matches the numbers',
    ],
  },
  'portfolio-oversight': {
    title: 'Post-Investment Oversight',
    positioning: 'Independent monitoring and reporting after the cheque is written — so investors know what is actually happening between board meetings.',
    outcomes: [
      'Structured, timely portfolio reporting',
      'Early visibility on deviation and risk',
      'A consistent, independent view of the portfolio',
      'Actionable escalation when things move off-plan',
    ],
  },
  governance: {
    title: 'Governance Monitoring',
    positioning: 'Ensuring governance standards are maintained between board meetings — across reporting, controls and accountability.',
    outcomes: [
      'Proportionate governance monitoring cadence',
      'Control and reporting checks between meetings',
      'Early flagging of governance drift',
      'Board-ready governance summaries',
    ],
  },
  'investor-representation': {
    title: 'Investor Representation',
    positioning: 'Independent, outsourced representation of investor interests at the table — credible, experienced and aligned.',
    outcomes: [
      'A credentialed voice at the board table',
      'Independent perspective, free of conflicts',
      'Consistent investor interests, clearly articulated',
      'Strong relationships with founders and management',
    ],
  },
};

export default function InvestorsPage() {
  return (
    <>
      <PageHero
        eyebrow="For Investors"
        title="Rigour, visibility and a voice at the table."
        subtitle="Independent support across the investment lifecycle — from readiness before the cheque to oversight and representation after it."
        crumbs={[{ label: 'Investors' }]}
        image={{ src: '/images/investors.jpg', alt: 'Investor oversight' }}
      >
        <Button asChild size="lg">
          <Link href="/contact?subject=Investor%20Services">Discuss Your Needs</Link>
        </Button>
      </PageHero>

      <section className="section-pad bg-background">
        <div className="container-lux">
          <SectionHeading
            eyebrow="What we do"
            title="Four ways we support investors"
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {investorServices.map((service, i) => {
              const Icon = icons[service.icon as keyof typeof icons] ?? Eye;
              const page = investorPages[service.slug as keyof typeof investorPages];
              return (
                <Reveal key={service.slug} delay={i * 80} className="h-full">
                  <Link
                    href={`/investors/${service.slug}`}
                    className="card-elevated group flex h-full flex-col p-8"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                        <Icon className="h-6 w-6" strokeWidth={1.8} />
                      </span>
                      <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h2 className="mt-6 text-h3 font-semibold text-foreground">{service.title}</h2>
                    <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">{page?.positioning ?? service.description}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-growth transition-colors group-hover:text-growth-600">
                      Explore service
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-pad bg-bgalt">
        <div className="container-lux grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Why independent"
              title="Distance creates clarity"
              description="When you are close to the operation, it is hard to see it clearly. Independent oversight gives investors an unfiltered, credentialed perspective — without the cost and commitment of a full-time hire."
            />
          </div>
          <Reveal>
            <ul className="grid gap-4">
              {investorCapabilities.map((cap, i) => (
                <li key={cap} className="flex items-center gap-4 rounded-lg border border-card-border bg-card p-5">
                  <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-growth/10 font-mono text-xs font-bold text-growth">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[15px] text-foreground">{cap}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <MediaBand src="/images/hero-1.webp" alt="Investor boardroom session" caption="Rigour, visibility, representation" height="md" />

      <section className="hero-pattern section-pad bg-navy text-white">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Track record"
            title="Built in the situations that matter"
            light
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { stat: '20+ yrs', label: 'Combined senior banking & turnaround experience' },
              { stat: 'NPLs & distressed', label: 'Assets, restructurings and workouts navigated' },
              { stat: 'Outsourced', label: 'Independent, conflict-free representation' },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 80}>
                <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
                  <p className="font-display text-3xl font-semibold text-brand">{item.stat}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">{item.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Invest with confidence"
        subtitle="Independent oversight from professionals who have lived the downside and protected the upside."
        primary={{ label: 'Contact Us', href: '/contact?subject=Investor%20Services' }}
      />
    </>
  );
}

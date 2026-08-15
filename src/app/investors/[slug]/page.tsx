import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { site } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

const investorPages = {
  'investor-readiness': {
    title: 'Investor Readiness',
    eyebrow: 'For Founders & Businesses',
    positioning: 'Preparing founders and businesses for investment — clean financials, governance and a credible story that stands up to due diligence.',
    detail:
      'Most investment conversations end before they start — not because the business is bad, but because the house is not in order. We help you build the financials, governance and narrative that survive first contact with an investor.',
    outcomes: [
      'A credible, investor-grade data room',
      'Clean financials and realistic forecasts',
      'A governance posture that passes diligence',
      'A founder story that matches the numbers',
    ],
    image: '/images/investor-readiness.jpg',
  },
  'portfolio-oversight': {
    title: 'Post-Investment Oversight',
    eyebrow: 'For Investors',
    positioning: 'Independent monitoring and reporting after the cheque is written — so investors know what is actually happening between board meetings.',
    detail:
      'Portfolios drift. Deviation is rarely dramatic — it is gradual, and it is usually visible early to a disciplined eye. We give investors structured reporting and independent escalation so risk never becomes surprise.',
    outcomes: [
      'Structured, timely portfolio reporting',
      'Early visibility on deviation and risk',
      'A consistent, independent view of the portfolio',
      'Actionable escalation when things move off-plan',
    ],
    image: '/images/portfolio-oversight.jpg',
  },
  governance: {
    title: 'Governance Monitoring',
    eyebrow: 'For Investors & Boards',
    positioning: 'Ensuring governance standards are maintained between board meetings — across reporting, controls and accountability.',
    detail:
      'Governance is what protects value between meetings. We monitor the cadence, controls and reporting that keep a portfolio company honest — flagging drift before it becomes a governance incident.',
    outcomes: [
      'Proportionate governance monitoring cadence',
      'Control and reporting checks between meetings',
      'Early flagging of governance drift',
      'Board-ready governance summaries',
    ],
    image: '/images/governance.jpg',
  },
  'investor-representation': {
    title: 'Investor Representation',
    eyebrow: 'For Investors',
    positioning: 'Independent, outsourced representation of investor interests at the table — credible, experienced and aligned.',
    detail:
      'Every board table deserves a voice that knows the business of investing. We represent investor interests independently — credentialed, conflict-free and respected by founders and management alike.',
    outcomes: [
      'A credentialed voice at the board table',
      'Independent perspective, free of conflicts',
      'Consistent investor interests, clearly articulated',
      'Strong relationships with founders and management',
    ],
    image: '/images/investor-rep.jpg',
  },
} as const;

type InvestorSlug = keyof typeof investorPages;

export async function generateStaticParams() {
  return Object.keys(investorPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = investorPages[slug as InvestorSlug];
  if (!page) return {};
  return {
    title: `${page.title} | Investor Services | Deni Sawa`,
    description: page.positioning,
    alternates: { canonical: `${site.url}/investors/${slug}` },
  };
}

export default async function InvestorServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = investorPages[slug as InvestorSlug];
  if (!page) notFound();

  return (
    <>
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        subtitle={page.positioning}
        crumbs={[{ label: 'Investors', href: '/investors' }, { label: page.title }]}
        image={{ src: page.image, alt: page.title }}
      >
        <Button asChild size="lg">
          <Link href={`/contact?subject=${encodeURIComponent(page.title)}`}>Discuss Your Needs</Link>
        </Button>
      </PageHero>

      <section className="section-pad bg-background">
        <div className="container-lux grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading align="left" eyebrow="About the service" title="What it means in practice" />
            <div className="prose prose-neutral max-w-none dark:prose-invert">
              <p className="text-lg leading-relaxed text-foreground">{page.detail}</p>
            </div>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href={`/contact?subject=${encodeURIComponent(page.title)}`}>
                  Talk to Us
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <aside>
            <SectionHeading align="left" eyebrow="Outcomes" title="What you get" />
            <div className="card-elevated p-8">
              <ul className="space-y-4">
                {page.outcomes.map((outcome) => (
                  <Reveal key={outcome}>
                    <li className="flex items-start gap-3 text-[15px] text-foreground">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-growth" strokeWidth={2} />
                      {outcome}
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <CTASection
        title="Ready to talk?"
        subtitle="Independent, experienced support across the investment lifecycle."
        primary={{ label: 'Get in Touch', href: '/contact' }}
      />
    </>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, Users, GraduationCap } from 'lucide-react';
import { site } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';
import { getLmsCourses } from '@/lib/supabase/queries';

const pathways = {
  'business-recovery': {
    title: 'Business Recovery',
    eyebrow: 'Learning Pathway',
    description: 'Rebuild and restructure under pressure — stabilising cash, creditors, operations and stakeholder confidence.',
    outline: [
      'Diagnosing the situation — how bad is it, really?',
      'Cash first — stabilising liquidity in the first 90 days',
      'Engaging creditors, lenders and suppliers constructively',
      'Cost discipline without breaking the operation',
      'The recovery plan and the stakeholder narrative',
      'Exiting survival mode — rebuilding for growth',
    ],
    outcomes: [
      'Run a clear diagnostic on a distressed business',
      'Build and sequence a 90-day cash stabilisation plan',
      'Communicate credibly with lenders and creditors',
      'Lead a turnaround without burning out the team',
    ],
    image: '/images/recovery.jpg',
    audience: 'Founders, turnaround leaders, insolvency practitioners and boards in or near a special situation.',
  },
  governance: {    title: 'Governance',
    eyebrow: 'Learning Pathway',
    description: 'Boards, policies and accountability — the discipline that protects value between and beyond meetings.',
    outline: [
      'Board basics — roles, responsibilities and fiduciary duty',
      'Board packs that drive decisions, not fatigue',
      'Financial governance and management accounts',
      'Policies, controls and the risk register',
      'Shareholder and investor communication',
      'Succession, committees and board evaluation',
    ],
    outcomes: [
      'Design or fix a board operating rhythm',
      'Build board packs that actually get read',
      'Put proportionate controls in place',
      'Communicate with shareholders with confidence',
    ],
    image: '/images/governance.jpg',
    audience: 'Board members, directors, founders with boards, and executives accountable to them.',
  },
  'financial-resilience': {
    title: 'Financial Resilience',
    eyebrow: 'Learning Pathway',
    description: 'Buffers, systems and sustainable performance — so the next shock is absorbed, not absorbed by you.',
    outline: [
      'Working capital as a buffer, not an accident',
      'Forecasting and early-warning indicators',
      'Pricing and margin resilience',
      'Capital structure and liquidity planning',
      'Stress-testing your own business model',
      'Embedding disciplines that outlast the crisis',
    ],
    outcomes: [
      'Build a cash buffer and a forecast cadence',
      'Identify the early-warning indicators that matter',
      'Stress-test the business model calmly',
      'Make resilience a habit, not a project',
    ],
    image: '/images/resilience.jpg',
    audience: 'CFOs, finance managers, founders and operators who want to build endurance into the business.',
  },
} as const;

type PathwaySlug = keyof typeof pathways;

export async function generateStaticParams() {
  return Object.keys(pathways).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pathway = pathways[slug as PathwaySlug];
  if (!pathway) return {};
  return {
    title: `${pathway.title} | Learning Pathway | Deni Sawa`,
    description: pathway.description,
    alternates: { canonical: `${site.url}/learning/${slug}` },
  };
}

export default async function LearningPathwayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pathway = pathways[slug as PathwaySlug];
  if (!pathway) notFound();

  let courseImage: string = pathway.image;
  try {
    const courses = await getLmsCourses();
    const match = courses.find((c) => c.slug === slug);
    if (match?.image_url) courseImage = match.image_url;
  } catch {
    courseImage = pathway.image;
  }

  return (
    <>
      <PageHero
        eyebrow={pathway.eyebrow}
        title={pathway.title}
        subtitle={pathway.description}
        crumbs={[{ label: 'Learning', href: '/learning' }, { label: pathway.title }]}
        image={{ src: courseImage, alt: pathway.title }}
      >
        <Button asChild size="lg">
          <Link href="/contact?subject=Learning%20Pathway">Enquire About This Pathway</Link>
        </Button>
      </PageHero>

      <section className="section-pad bg-background">
        <div className="container-lux grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading align="left" eyebrow="Course outline" title="What the pathway covers" />
            <ol className="space-y-4">
              {pathway.outline.map((item, i) => (
                <Reveal key={item} delay={i * 60}>
                  <li className="flex items-start gap-4 rounded-lg border border-card-border bg-card p-5">
                    <span className="mt-0.5 font-mono text-sm font-bold text-brand">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-[15px] leading-relaxed text-foreground">{item}</span>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>

          <aside>
            <SectionHeading align="left" eyebrow="Outcomes" title="Leave with the ability to" />
            <div className="card-elevated p-8">
              <ul className="space-y-4">
                {pathway.outcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-3 text-[15px] text-foreground">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-growth" strokeWidth={2} />
                    {outcome}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-lg border border-card-border bg-card p-6">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-brand" strokeWidth={1.8} />
                <h3 className="font-semibold text-foreground">Who it is for</h3>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{pathway.audience}</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-card-border bg-card p-5">
                <Users className="h-5 w-5 text-brand" strokeWidth={1.8} />
                <p className="mt-3 text-sm font-semibold text-foreground">Small cohorts</p>
                <p className="mt-0.5 text-xs text-muted-foreground">High-touch delivery</p>
              </div>
              <div className="rounded-lg border border-card-border bg-card p-5">
                <Clock className="h-5 w-5 text-brand" strokeWidth={1.8} />
                <p className="mt-3 text-sm font-semibold text-foreground">Practitioner-led</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Real special-situation cases</p>
              </div>
            </div>

            <div className="mt-8">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/contact?subject=Learning%20Pathway">
                  Enquire Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </section>

      <CTASection
        title="Build the capability your situation demands"
        subtitle="Pathways are delivered in small cohorts and available for in-house teams."
        primary={{ label: 'Talk to Us', href: '/contact' }}
      />
    </>
  );
}

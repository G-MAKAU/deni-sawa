import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, Users, CalendarCheck, Trophy } from 'lucide-react';
import { site, learningPrograms } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { MediaBand } from '@/components/MediaBand';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Executive Finance for Non-Finance Leaders | Deni Sawa Learning',
  description: learningPrograms[0].positioning,
  alternates: { canonical: `${site.url}/learning/executive-finance` },
};

const programme = learningPrograms[0];

const modules = [
  { title: 'Financial Statements — The Story in Three Reports', text: 'Read the balance sheet, income statement and cashflow statement as one connected narrative.' },
  { title: 'Cashflow & Working Capital', text: 'Why cash is king, and how to manage the operating cycle with discipline.' },
  { title: 'Profitability & Pricing', text: 'Margins, contribution and the economics behind every pricing decision.' },
  { title: 'Budgeting, Forecasting & Variance', text: 'Build budgets that mean something and read variance like a signal, not a surprise.' },
  { title: 'Governance, Controls & Reporting', text: 'The discipline that protects the business — board packs, controls and accountability.' },
  { title: 'Finance as Leadership', text: 'Framing financial decisions for boards, investors and teams — and the capstone case study.' },
];

const outcomes = [
  'Read financial statements with confidence',
  'Challenge assumptions with evidence',
  'Make better decisions around profitability and cashflow',
  'Manage working capital with discipline',
  'Communicate with boards and investors',
];

export default function ExecutiveFinancePage() {
  return (
    <>
      <PageHero
        eyebrow="Learning · Flagship Programme"
        title={programme.title}
        subtitle={programme.positioning}
        crumbs={[{ label: 'Learning', href: '/learning' }, { label: 'Executive Finance' }]}
        image={{ src: '/images/exec-finance.jpg', alt: 'Executive Finance programme' }}
      >
        <Button asChild size="lg">
          <Link href="/contact?subject=Executive%20Finance%20Programme">Enquire About the Programme</Link>
        </Button>
      </PageHero>

      {/* Why / outcomes */}
      <section className="section-pad bg-background">
        <div className="container-lux grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading align="left" eyebrow="Why this programme" title="Leadership runs on the numbers" />
            <div className="space-y-4">
              {modules.map((module, i) => (
                <Reveal key={module.title} delay={i * 60}>
                  <div className="flex items-start gap-4 rounded-lg border border-card-border bg-card p-5">
                    <span className="mt-0.5 font-mono text-sm font-bold text-brand">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{module.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{module.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <aside>
            <SectionHeading align="left" eyebrow="By the end" title="You will be able to" />
            <div className="card-elevated p-8">
              <ul className="space-y-4">
                {outcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-3 text-[15px] text-foreground">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-growth" strokeWidth={2} />
                    {outcome}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              {[
                { icon: Users, label: 'Cohort delivery', text: 'Learn with peers' },
                { icon: CalendarCheck, label: '6 modules', text: 'Practitioner-led' },
                { icon: BookOpen, label: 'Case studies', text: 'Real situations' },
                { icon: Trophy, label: 'Capstone', text: 'Applied project' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-card-border bg-card p-5">
                  <stat.icon className="h-5 w-5 text-brand" strokeWidth={1.8} />
                  <p className="mt-3 text-sm font-semibold text-foreground">{stat.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{stat.text}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <MediaBand src="/images/hero-2.jpg" alt="Executive Finance cohort in session" caption="Where leadership meets the numbers" height="md" />

      <section className="hero-pattern section-pad bg-navy text-white">
        <div className="container-lux">
          <SectionHeading eyebrow="Format" title="How it runs" align="left" light />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: 'Live cohort', text: 'Small groups, guided by practitioners who have lived the situations — not academics.' },
              { title: 'Real case studies', text: 'Each module is anchored in a real special-situation or growth case.' },
              { title: 'Practical take-aways', text: 'Templates and frameworks you can apply to your business the same week.' },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to build financial intelligence?"
        subtitle="Cohort places are limited to keep the experience high-touch."
        primary={{ label: 'Enquire Now', href: '/contact?subject=Executive%20Finance%20Programme' }}
      />
    </>
  );
}

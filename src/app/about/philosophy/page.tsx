import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Eye, Compass, Waves } from 'lucide-react';
import { site } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { MediaBand } from '@/components/MediaBand';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Philosophy | How We Think and Work | Deni Sawa',
  description:
    'The beliefs behind the Deni Sawa method — candour, discipline, reversibility, and the conviction that situations are fixed fastest with the truth on the table.',
  alternates: { canonical: `${site.url}/about/philosophy` },
};

const principles = [
  {
    icon: Eye,
    title: 'Truth before comfort',
    text: 'Situations are fixed fastest when the real position is known early. We tell you what we see, measure it, and build from there.',
  },
  {
    icon: Waves,
    title: 'Distress is reversible',
    text: 'Most special situations are solvable — if the diagnosis is honest and the response is disciplined. We have seen it done, again and again.',
  },
  {
    icon: Compass,
    title: 'Systems outlast mandates',
    text: 'We do not aim to be needed forever. We build the systems, controls and capability so performance compounds after we leave.',
  },
];

export default function PhilosophyPage() {
  return (
    <>
      <PageHero
        eyebrow="About · Philosophy"
        title="How we think about situations."
        subtitle="The beliefs that shape the method — and the work we do in the hardest rooms."
        crumbs={[{ label: 'About', href: '/about' }, { label: 'Philosophy' }]}
        image={{ src: '/images/philosophy.jpg', alt: 'Deni Sawa philosophy' }}
      />

      <section className="section-pad bg-background">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Core principles"
            title="Three beliefs, held every day"
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {principles.map((principle, i) => (
              <Reveal key={principle.title} delay={i * 80} className="h-full">
                <div className="card-elevated flex h-full flex-col p-8">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <principle.icon className="h-6 w-6" strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-5 text-h3 font-semibold text-foreground">{principle.title}</h3>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">{principle.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-bgalt">
        <div className="container-lux grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="The Deni Sawa promise"
              title="Sawa means what it means"
              description="The name carries the promise: get it right, put it in order, make it right. It is the standard we hold ourselves to — from a free Health Check to a full mandate."
            />
          </div>
          <Reveal>
            <div className="space-y-4">
              {[
                'We diagnose before we prescribe.',
                'We measure what matters — and report honestly.',
                'We act like owners, not consultants.',
                'We leave the organisation stronger than we found it.',
              ].map((promise, i) => (
                <div key={promise} className="flex items-start gap-4 rounded-lg border border-card-border bg-card p-5">
                  <span className="mt-0.5 font-mono text-sm font-bold text-growth">{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-[15px] leading-relaxed text-foreground">{promise}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <MediaBand src="/images/strategy.jpg" alt="The philosophy in practice" caption="Diagnose first. Always." height="md" />

      <CTASection
        title="See the philosophy in action"
        subtitle="The free Health Check is the method, applied to you — no commitment required."
        primary={{ label: 'Take a Health Check', href: '/health-checks' }}
      />
    </>
  );
}

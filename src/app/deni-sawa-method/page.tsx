import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { MediaBand } from '@/components/MediaBand';
import { MethodSignature } from '@/components/MethodSignature';
import { JourneyProgression } from '@/components/JourneyProgression';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'The Deni Sawa Method | Diagnose · Evaluate · Negotiate · Implement · Sustain',
  description:
    'Our disciplined, expert-led method moves organisations from Special Situations to Best-in-Class — Diagnose, Evaluate, Negotiate, Implement, Sustain.',
  alternates: { canonical: `${site.url}/deni-sawa-method` },
};

export default function MethodPage() {
  return (
    <>
      <PageHero
        eyebrow="The Deni Sawa Method"
        title="From Special Situations to Best-in-Class."
        subtitle="A disciplined, five-part method — Diagnose, Evaluate, Negotiate, Implement, Sustain — that anchors everything we do, from a free Health Check to full advisory engagements."
        crumbs={[{ label: 'The Method' }]}
        image={{ src: '/images/method.jpg', alt: 'The Deni Sawa Method' }}
      >
        <Button asChild size="lg">
          <Link href="/health-checks#choose-your-assessment">Start With a Diagnosis</Link>
        </Button>
      </PageHero>

      {/* Method steps */}
      <section className="section-pad bg-background">
        <div className="container-lux">
          <SectionHeading
            eyebrow="The five disciplines"
            title="DENIS"
            description="Five disciplines, applied in sequence. Each one has a clear objective, a concrete example and a service that brings it to life."
          />
          <MethodSignature />
        </div>
      </section>

      {/* Journey */}
      <section className="section-pad bg-bgalt">
        <div className="container-lux">
          <SectionHeading
            eyebrow="The journey"
            title="Recovery → Resilience → Growth → Best-in-Class"
            description="The method plays out as a staged journey. Each stage builds on the last — and each one is measured, not assumed."
          />
          <JourneyProgression />
        </div>
      </section>

      <MediaBand src="/images/implement.jpg" alt="The Deni Sawa Method in practice" caption="Diagnose → Evaluate → Negotiate → Implement → Sustain" height="lg" />

      {/* How it applies */}
      <section className="hero-pattern section-pad bg-charcoal text-white">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Applied everywhere"
            title="One method. Every entry point."
            light
            description="The same disciplines power a free Health Check, a mentorship engagement, a fractional CFO placement or a full special-situations mandate."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Free', title: 'Health Check', text: 'Diagnosis you can access today.' },
              { label: 'Self-learning', title: 'Learning Centre', text: 'Build the capability yourself.' },
              { label: 'Guided', title: 'Mentorship', text: 'Progress with a seasoned practitioner.' },
              { label: 'Engaged', title: 'Fractional & Advisory', text: 'A full operating bench for the situation.' },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">{item.label}</span>
                  <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Start with a diagnosis"
        subtitle="Free. Confidential. In under 15 minutes you will know where you stand."
        primary={{ label: 'Take a Health Check', href: '/health-checks#choose-your-assessment' }}
      />
    </>
  );
}

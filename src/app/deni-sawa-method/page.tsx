import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, HeartPulse, Shield, TrendingUp, Award } from 'lucide-react';
import { site, methodSteps, journeyStages } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { MediaBand } from '@/components/MediaBand';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'The Deni Sawa Method | Diagnose · Evaluate · Negotiate · Implement · Sustain',
  description:
    'Our disciplined, AI-enabled method moves organisations from Special Situations to Best-in-Class — Diagnose, Evaluate, Negotiate, Implement, Sustain.',
  alternates: { canonical: `${site.url}/deni-sawa-method` },
};

const stageIcons = {
  HeartPulse,
  Shield,
  TrendingUp,
  Award,
} as const;

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
          <Link href="/health-checks">Start With a Diagnosis</Link>
        </Button>
      </PageHero>

      {/* Method steps */}
      <section className="section-pad bg-background">
        <div className="container-lux">
          <SectionHeading
            eyebrow="The five disciplines"
            title="DENIS"
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {methodSteps.map((step, i) => (
              <Reveal key={step.letter} delay={i * 80} className="h-full">
                <div className="card-elevated relative flex h-full flex-col p-6">
                  <span className="font-display text-5xl font-semibold leading-none text-brand/90">{step.letter}</span>
                  <span className="mt-4 h-px w-10 bg-brand/40" />
                  <h2 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  <span className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Discipline {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {journeyStages.map((stage, i) => {
              const Icon = stageIcons[stage.icon as keyof typeof stageIcons] ?? TrendingUp;
              return (
                <Reveal key={stage.stage} delay={i * 80} className="h-full">
                  <div className="relative flex h-full flex-col rounded-lg border border-card-border bg-card p-7">
                    <span className="absolute right-5 top-5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Stage {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Icon className="h-6 w-6" strokeWidth={1.8} />
                    </span>
                    <h3 className="mt-5 text-h3 font-semibold text-foreground">{stage.stage}</h3>
                    <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">{stage.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
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
              { label: 'Free', title: 'AI Health Check', text: 'Diagnosis you can access today.' },
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
        subtitle="Free. Confidential. AI-powered. In under 15 minutes you will know where you stand."
        primary={{ label: 'Take a Health Check', href: '/health-checks' }}
      />
    </>
  );
}

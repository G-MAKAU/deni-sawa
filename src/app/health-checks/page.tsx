import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ClipboardCheck, Sparkles, FileText, Lock, Check } from 'lucide-react';
import { site, healthChecks } from '@/data/site';
import { getServiceClient } from '@/lib/supabase/service';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Business & Financial Health Check | AI-Powered Assessment | Deni Sawa',
  description:
    'Take our free AI-powered Business or Professional Financial Health Check and receive a diagnostic report with prioritised recommendations.',
  alternates: { canonical: `${site.url}/health-checks` },
};

const howItWorks = [
  { step: '01', icon: ClipboardCheck, title: 'Answer questions', description: 'A structured, confidential assessment — around 20 questions, answered section by section.' },
  { step: '02', icon: Sparkles, title: 'AI generates your report', description: 'Claude AI turns your answers into a diagnostic report with prioritised recommendations.' },
  { step: '03', icon: FileText, title: 'Receive recommendations', description: 'A readable, actionable report you can export as PDF or Word — and take to a conversation.' },
];

const comparison = [
  { label: 'AI-generated diagnostic report', basic: true, full: true },
  { label: 'Executive summary', basic: true, full: true },
  { label: 'Top 3 priority callouts', basic: true, full: true },
  { label: 'Category-by-category findings', basic: false, full: true },
  { label: 'Prioritised recommendation list', basic: false, full: true },
  { label: 'PDF & Word export', basic: true, full: true },
  { label: 'Emailed to you with a private link', basic: true, full: true },
];

/** Cover images set on health checks in the admin (Supabase storage), keyed by slug. */
async function getCheckImages(): Promise<Record<string, { image: string | null; minutes: number | null }>> {
  try {
    const supabase = getServiceClient();
    const slugs = [
      `${healthChecks.business.slug}-health-check`,
      `${healthChecks.professional.slug}-health-check`,
    ];
    const { data } = await supabase.from('health_checks').select('slug, image_url, estimated_minutes').in('slug', slugs);
    const map: Record<string, { image: string | null; minutes: number | null }> = {};
    (data ?? []).forEach((c) => {
      map[c.slug] = {
        image: (c.image_url as string | null) ?? null,
        minutes: (c.estimated_minutes as number | null) ?? null,
      };
    });
    return map;
  } catch {
    return {};
  }
}

export default async function HealthChecksPage() {
  const images = await getCheckImages();

  return (
    <>
      <PageHero
        eyebrow="Health Checks"
        title="Understand Your Situation. Get Clarity. Take Action."
        subtitle="Two AI-powered assessments that turn a structured set of questions into a diagnostic report — with prioritised recommendations you can act on."
        crumbs={[{ label: 'Health Checks' }]}
        image={{ src: '/images/health-check.jpg', alt: 'Health check assessment' }}
      >
        <Button asChild size="lg">
          <Link href="/health-checks#choose-assessment">Choose Your Assessment</Link>
        </Button>
      </PageHero>

      {/* Entry cards */}
      <section id="choose-assessment" className="scroll-mt-24 section-pad bg-background">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Choose your assessment"
            title="Two checks. One standard of rigour."
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[healthChecks.business, healthChecks.professional].map((check, i) => {
              const slugKey = `${check.slug}-health-check`;
              const imageSrc =
                images[slugKey]?.image ?? (i === 0 ? '/images/business-check.jpg' : '/images/professional-check.jpg');
              const minutes = images[slugKey]?.minutes ?? 15;
              return (
                <Reveal key={check.slug} delay={i * 80} className="h-full">
                  <div className="card-elevated group flex h-full flex-col overflow-hidden">
                    {/* Cover image */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <Image
                        src={imageSrc}
                        alt={check.title}
                        fill
                        priority={i === 0}
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />
                      <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/90 text-white shadow-lg">
                          {i === 0 ? <ClipboardCheck className="h-5 w-5" strokeWidth={1.8} /> : <Sparkles className="h-5 w-5" strokeWidth={1.8} />}
                        </span>
                        <span className="rounded-full bg-[#111111]/55 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/85 backdrop-blur-sm">
                          {String(i + 1).padStart(2, '0')} / Free · ~{minutes} min
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 flex-col p-7">
                      <h2 className="text-h3 font-semibold text-foreground">{check.title}</h2>
                      <p className="mt-3 flex-1 leading-relaxed text-muted-foreground">{check.description}</p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {check.areas.map((area) => (
                          <span key={area} className="rounded-badge border border-card-border bg-bgalt px-3 py-1 text-xs font-medium text-foreground">
                            {area}
                          </span>
                        ))}
                      </div>
                      <div className="mt-8">
                        <Button asChild size="lg">
                          <Link href={`/health-checks/${slugKey}`}>
                            Start Assessment
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-pad bg-bgalt">
        <div className="container-lux">
          <SectionHeading eyebrow="How it works" title="Three steps to clarity" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {howItWorks.map((step, i) => (
              <Reveal key={step.step} delay={i * 80} className="h-full">
                <div className="card-elevated flex h-full flex-col">
                  <span className="font-mono text-sm font-bold text-brand">{step.step}</span>
                  <span className="my-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-growth/10 text-growth">
                    <step.icon className="h-6 w-6" strokeWidth={1.8} />
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Basic vs Full */}
      <section className="section-pad bg-background">
        <div className="container-lux">
          <SectionHeading
            eyebrow="What you get"
            title="Start with the free summary. Unlock the full diagnostic."
            subtitle="Every assessment generates an AI diagnostic report immediately — the summary is free, and the full detailed report is available as a one-off upgrade."
          />
          <Reveal>
            <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-card-border bg-card">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-card-border px-6 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <span>Report feature</span>
                <span className="w-24 text-center">Free</span>
                <span className="w-24 text-center">Full</span>
              </div>
              {comparison.map((row) => (
                <div key={row.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-card-border/60 px-6 py-3.5 text-sm last:border-0">
                  <span className="text-foreground">{row.label}</span>
                  <span className="w-24 text-center">
                    {row.basic ? <Check className="mx-auto h-4 w-4 text-growth" /> : <span className="text-muted-foreground/40">—</span>}
                  </span>
                  <span className="w-24 text-center">
                    {row.full ? <Check className="mx-auto h-4 w-4 text-brand" /> : <span className="text-muted-foreground/40">—</span>}
                  </span>
                </div>
              ))}
              <p className="px-6 py-4 text-xs leading-relaxed text-muted-foreground">
                The free summary report is delivered by email or WhatsApp with a private link. The full diagnostic —
                with category-by-category findings and the prioritised recommendation list — is a one-off upgrade.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Privacy */}
      <section className="hero-pattern section-pad bg-charcoal text-white">
        <div className="container-lux flex flex-col items-center gap-6 text-center">
          <Reveal>
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/15 text-brand">
              <Lock className="h-6 w-6" />
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="max-w-2xl text-h2 font-semibold text-white">Your data stays yours</h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="max-w-xl text-lg leading-relaxed text-white/65">
              Your responses and report are confidential, used only to generate your diagnosis, and never shared. Reports
              are private and unique to you — we do not index them publicly.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <Button asChild size="lg" variant="ghost">
              <Link href="/privacy">Read our Privacy Policy</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      <CTASection
        title="Ready to see where you stand?"
        subtitle="Take the free assessment now. You'll have a diagnostic report within minutes."
      />
    </>
  );
}

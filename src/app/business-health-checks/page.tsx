import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ClipboardCheck, Sparkles, FileText, Lock, Check } from 'lucide-react';
import { site } from '@/data/site';
import { getActiveHealthChecks } from '@/lib/health-checks';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd';

export const metadata: Metadata = {
  title: 'Business & Financial Health Check | Deni Sawa',
  description:
    'Take our free Business or Professional Financial Health Check and receive a diagnostic report with prioritised recommendations.',
  alternates: { canonical: `${site.url}/business-health-checks` },
};

const howItWorks = [
  { step: '01', icon: ClipboardCheck, title: 'Answer questions', description: 'A structured, confidential assessment — around 20 questions, answered section by section.' },
  { step: '02', icon: Sparkles, title: 'Your report is prepared', description: 'Your answers are analysed and a structured report is prepared, which our advisors use as the foundation for your first conversation.' },
  { step: '03', icon: FileText, title: 'Receive recommendations', description: 'A readable, actionable report you can export as PDF or Word — and take to a conversation.' },
];

const comparison = [
  { label: 'Diagnostic score per section', basic: true, full: true },
  { label: 'Executive summary', basic: true, full: true },
  { label: 'Top 3 priority areas (named only)', basic: true, full: true },
  { label: 'Category-by-category findings', basic: false, full: true },
  { label: 'What each finding means for your business', basic: false, full: true },
  { label: 'Prioritised recommendation list', basic: false, full: true },
  { label: 'Action plan with next steps', basic: false, full: true },
  { label: 'Advisor commentary section', basic: false, full: true },
  { label: 'PDF export', basic: false, full: true },
  { label: 'Word export', basic: false, full: true },
  { label: 'Private report link (view online)', basic: true, full: true },
  { label: 'Emailed / WhatsApp delivery', basic: true, full: true },
  { label: 'Report valid for', basic: '30 days', full: '12 months' },
];

const faqs = [
  { q: 'What is a Business Health Check?', a: 'A Business Health Check is a structured diagnostic assessment that evaluates your financial health across key areas. It generates a detailed report with findings and prioritised recommendations you can act on immediately.' },
  { q: 'How long does the assessment take?', a: 'Most assessments take around 15-20 minutes. The questions are structured section by section, and you can save your progress and return later.' },
  { q: 'Is my data confidential?', a: 'Yes. Your responses and report are completely confidential. We never share your data with third parties, and reports are private and unique to you.' },
  { q: 'What happens after I complete the assessment?', a: 'You receive a diagnostic report immediately — a free summary plus the option to unlock the full detailed report. The report includes findings, priority callouts, and a roadmap for next steps.' },
  { q: 'Can I use the report with an advisor?', a: 'Absolutely. The report is designed to be shared with our advisors or your own financial team. It provides a structured foundation for strategic conversations.' },
];

export default async function HealthChecksPage() {
  const checks = await getActiveHealthChecks();

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <BreadcrumbJsonLd items={[{ label: 'Home', href: '/' }, { label: 'Health Checks' }]} />

      <section id="overview" className="scroll-mt-20">
        <PageHero
          eyebrow="Health Checks"
          title="Understand Your Situation. Get Clarity. Take Action."
          subtitle="Structured assessments that turn your answers into a diagnostic report — with prioritised recommendations you can act on."
          crumbs={[{ label: 'Health Checks' }]}
          image={{ src: '/images/hero-health-checks.webp', alt: 'Professional completing a structured business assessment' }}
          compactImage
        >
          <Button asChild size="lg">
            <Link href="/business-health-checks#choose-your-assessment">Choose Your Assessment</Link>
          </Button>
        </PageHero>
      </section>

      {/* In-page quick-nav — floats at the very top while scrolling down */}
      <section className="sticky top-0 z-30 border-b border-card-border bg-background/95 backdrop-blur-md">
        <div className="container-lux">
          <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto py-3">
            {[
              { label: 'Overview', href: '#overview' },
              ...checks.map((check) => ({ label: check.title, href: `#${check.slug}` })),
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'What You Get', href: '#what-you-get' },
              { label: 'Start Your Assessment', href: '#choose-your-assessment' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-badge border border-card-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Entry cards */}
      <section id="choose-your-assessment" className="scroll-mt-20 section-pad bg-background">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Choose your assessment"
            title=""
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {checks.map((check, i) => {
              const imageSrc = check.image_url ?? (i === 0 ? '/images/check-business.webp' : '/images/check-professional.webp');
              const minutes = check.estimated_minutes;
              return (
                <Reveal
                  key={check.id}
                  delay={i * 80}
                  className="h-full"
                  id={check.slug}
                >
                  <Link
                    href={`/business-health-checks/${check.slug}`}
                    className="card-elevated group flex h-full flex-col overflow-hidden"
                  >
                    {/* Title first */}
                    <div className="p-7 -mt-7 pb-0">
                      <h2 className="text-h3 mb-2 font-semibold text-foreground">{check.title}</h2>
                    </div>

                    {/* Then image */}
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

                    {/* Then rest of body */}
                    <div className="flex flex-1 flex-col p-7 pt-0">
                      <p className="mt-3 flex-1 leading-relaxed text-muted-foreground">{check.description}</p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {check.tags.map((area) => (
                          <span key={area} className="rounded-badge border border-card-border bg-bgalt px-3 py-1 text-xs font-medium text-foreground">
                            {area}
                          </span>
                        ))}
                      </div>
                      <div className="mt-8">
                        <span className="inline-flex items-center gap-2 rounded-md bg-brand px-6 py-3 text-[15px] font-semibold text-white transition-colors group-hover:bg-brand-600">
                          Start Assessment
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 section-pad bg-bgalt">
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
      <section id="what-you-get" className="scroll-mt-20 section-pad bg-background">
        <div className="container-lux">
          <SectionHeading
            eyebrow="What you get"
            title="Start with the free summary. Unlock the full diagnostic."
            subtitle="Every assessment generates a diagnostic report immediately — the summary is free, and the full detailed report is available as a one-off upgrade."
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
                    {typeof row.basic === 'string' ? (
                      <span className="text-xs text-muted-foreground">{row.basic}</span>
                    ) : row.basic ? (
                      <Check className="mx-auto h-4 w-4 text-growth" />
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </span>
                  <span className="w-24 text-center">
                    {typeof row.full === 'string' ? (
                      <span className="text-xs font-medium text-brand">{row.full}</span>
                    ) : row.full ? (
                      <Check className="mx-auto h-4 w-4 text-brand" />
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </span>
                </div>
              ))}
              <p className="px-6 py-4 text-xs leading-relaxed text-muted-foreground">
                The free summary report gives you scores, an executive summary, and your top 3 priorities — delivered by email or WhatsApp with a private link, valid for 30 days. The full diagnostic adds category-by-category findings, recommendations, an action plan, advisor commentary, and PDF/Word export — valid for 12 months.
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

      {/* FAQ */}
      <section className="section-pad bg-background">
        <div className="container-lux">
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about the Business Health Check."
          />
          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((faq, i) => (
              <Reveal key={faq.q} delay={i * 60}>
                <details className="group rounded-lg border border-card-border bg-card p-6 transition-colors hover:border-brand/30">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-semibold text-foreground">
                    {faq.q}
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{faq.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to see where you stand?"
        subtitle="Take the free assessment now. You'll have a diagnostic report within minutes."
      />
    </>
  );
}

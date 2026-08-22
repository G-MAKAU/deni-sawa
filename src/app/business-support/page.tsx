import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { site, services } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { MediaBand } from '@/components/MediaBand';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';
import { BrandIcon } from '@/components/BrandIcon';
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd';

export const metadata: Metadata = {
  title: 'Fractional CFO & CEO Business Support | Deni Sawa Partners',
  description:
    'Senior-level fractional CFO, CEO, governance and growth support. Part-time commitment, full-time impact. Serving businesses in crisis and growth.',
  alternates: { canonical: `${site.url}/business-support` },
};

export default function BusinessSupportPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ label: 'Home', href: '/' }, { label: 'Business Support' }]} />
      <PageHero
        eyebrow="Business Support"
        title="Senior-level expertise. Part-time commitment. Full-time impact."
        subtitle="A seasoned operating bench — fractional CFO, CEO, governance, growth and special situations support — for organisations that need boardroom capability without boardroom payroll."
        crumbs={[{ label: 'Business Support' }]}
        image={{ src: '/images/hero-services.webp', alt: 'Modern business district representing premium advisory services' }}
      >
        <Button asChild size="lg">
          <Link href="/business-health-checks#choose-your-assessment">Start Your Assessment</Link>
        </Button>
      </PageHero>

      {/* Anchored quick-nav — floats at the very top while scrolling down; returns on scroll up */}
      <section className="sticky top-0 z-30 border-b border-card-border bg-background/95 backdrop-blur-md">
        <div className="container-lux">
          <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto py-3">
            {services.map((service) => (
              <a
                key={service.slug}
                href={`#${service.slug}`}
                className="whitespace-nowrap rounded-badge border border-card-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
              >
                {service.title.split(' / ')[0]}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Service areas */}
      <section className="section-pad bg-background">
        <div className="container-lux space-y-20">
          {services.map((service, idx) => (
            <Reveal key={service.slug} as="section" id={service.slug} className="scroll-mt-40">
              <div className="grid gap-10 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <BrandIcon name={service.icon as never} className="h-7 w-7" strokeWidth={1.7} />
                  </span>
                  <span className="mb-3 block font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {String(idx + 1).padStart(2, '0')} / Service Area
                  </span>
                  <h2 className="text-h2 font-semibold text-foreground">{service.title}</h2>
                  <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{service.positioning}</p>
                </div>

                <div className="lg:col-span-3">
                  <h3 className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    What we deliver
                  </h3>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {service.capabilities.map((cap) => (
                      <li key={cap} className="flex items-start gap-3 text-[15px] leading-relaxed text-foreground">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-growth" strokeWidth={2} />
                        {cap}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <Button asChild>
                      <Link href={`/contact?service=${service.slug}&source=business-support`}>
                        Discuss This
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Link
                      href={`/business-support/${service.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-600"
                    >
                      Explore in detail
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
              {idx < services.length - 1 && <div className="divider-brand mt-20" />}
            </Reveal>
          ))}
        </div>
      </section>

      <MediaBand
        src="/images/academy-hero.jpg"
        alt="Deni Sawa Partners advisory engagement"
        caption="Boardroom capability. Part-time commitment."
        height="md"
      />

      <CTASection
        title="Not sure which service fits?"
        subtitle="Start with the Business Health Check — a diagnostic report will show you exactly where the attention is needed."
      />
    </>
  );
}

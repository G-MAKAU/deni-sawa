import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { site, services } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';
import { BrandIcon } from '@/components/BrandIcon';

export const dynamicParams = true;

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};
  return {
    title: `${service.title.split(' / ')[0]} | Business Support | Deni Sawa Partners`,
    description: service.short,
    alternates: { canonical: `${site.url}/business-support/${service.slug}` },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  const otherServices = services.filter((s) => s.slug !== slug);
  const heroImages: Record<string, string> = {
    'fractional-cfo': '/images/exec-finance.jpg',
    'fractional-ceo': '/images/leadership.jpg',
    'governance-controls': '/images/governance.jpg',
    'growth-support': '/images/growth.jpg',
    'special-situations': '/images/recovery.jpg',
  };
  const heroImage = heroImages[slug] ?? '/images/about-team.jpg';

  return (
    <>
      <PageHero
        eyebrow="Business Support"
        title={service.title}
        subtitle={service.positioning}
        image={{ src: heroImage, alt: service.title }}
        crumbs={[
          { label: 'Business Support', href: '/business-support' },
          { label: service.title.split(' / ')[0] },
        ]}
      >
        <Button asChild size="lg">
          <Link href={`/contact?service=${service.slug}&source=business-support`}>
            Discuss This
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link href="/health-checks/business-health-check">Take the Business Health Check</Link>
        </Button>
      </PageHero>

      <section className="section-pad bg-background">
        <div className="container-lux grid gap-12 lg:grid-cols-5">
          {/* Capabilities */}
          <div className="lg:col-span-3">
            <SectionHeading
              align="left"
              eyebrow="What we deliver"
              title="Capabilities"
            />
            <ul className="grid gap-3 sm:grid-cols-2">
              {service.capabilities.map((cap) => (
                <li key={cap} className="card-elevated flex items-start gap-3 p-5 text-[15px] leading-relaxed text-foreground">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-growth" strokeWidth={2} />
                  {cap}
                </li>
              ))}
            </ul>
          </div>

          {/* Outcomes */}
          <aside className="lg:col-span-2">
            <div className="sticky top-36 space-y-6">
              <div className="card-dark-panel">
                <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-white/50">
                  What changes
                </h3>
                <ul className="space-y-4">
                  {service.outcomes.map((outcome) => (
                    <li key={outcome} className="flex items-start gap-3 text-[15px] leading-relaxed text-white/85">
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/business-support"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
              >
                <ArrowLeft className="h-4 w-4" /> All Business Support
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Related services */}
      <section className="section-pad bg-bgalt">
        <div className="container-lux">
          <SectionHeading eyebrow="Related" title="Explore other service areas" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {otherServices.map((s, i) => (
              <Reveal key={s.slug} delay={i * 80} className="h-full">
                <Link href={`/business-support/${s.slug}`} className="card-elevated group flex h-full flex-col">
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                    <BrandIcon name={s.icon as never} className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">{s.title.split(' / ')[0]}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.short}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-growth">
                    Learn More <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}

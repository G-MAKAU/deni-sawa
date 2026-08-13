import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ServiceDetail } from '@/components/ServiceDetail';
import { CTABanner } from '@/components/CTABanner';
import { services, business } from '@/data/content';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);

  if (!service) {
    return { title: 'Service Not Found' };
  }

  return {
    title: `${service.title} | Deni Sawa`,
    description: service.summary,
    alternates: {
      canonical: `${business.website}/services/${service.slug}`,
    },
    openGraph: {
      title: `${service.title} | Deni Sawa`,
      description: service.summary,
      images: [service.detailImage],
    },
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = getService(slug);

  if (!service) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        backgroundImage={service.detailImage}
        heading={service.title}
        items={[{ label: 'Services', to: '/services' }, { label: service.tab }]}
      />
      <ServiceDetail service={service} />
      <CTABanner />
    </main>
  );
}
'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Services } from '@/components/Services';
import { Programs } from '@/components/Programs';
import { Process } from '@/components/Process';
import { CTABanner } from '@/components/CTABanner';

export function ServicesPage() {
  return (
    <main>
      <Breadcrumbs
        backgroundImage="/images/services-hero.jpg"
        heading="Our Services"
        items={[{ label: 'Services' }]}
      />
      <Services />
      <Programs />
      <Process />
      <CTABanner />
    </main>
  );
}
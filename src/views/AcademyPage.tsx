'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Academy } from '@/components/Academy';
import { AcademyCatalog } from '@/components/AcademyCatalog';
import { WhyChoose } from '@/components/WhyChoose';
import { CTABanner } from '@/components/CTABanner';

export function AcademyPage() {
  return (
    <main>
      <Breadcrumbs
        backgroundImage="/images/academy-hero.jpg"
        heading="Deni Sawa Academy"
        items={[{ label: 'Academy' }]}
      />
      <Academy />
      <AcademyCatalog />
      <WhyChoose />
      <CTABanner />
    </main>
  );
}
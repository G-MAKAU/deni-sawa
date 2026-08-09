'use client';

import { Hero } from '@/components/Hero';
import { TrustBar } from '@/components/TrustBar';
import { Services } from '@/components/Services';
import { Process } from '@/components/Process';
import { WhyChoose } from '@/components/WhyChoose';
import { Academy } from '@/components/Academy';
import { Testimonials } from '@/components/Testimonials';
import { Resources } from '@/components/Resources';
import { CTABanner } from '@/components/CTABanner';

export function HomePage() {
  return (
    <main>
      <Hero />
      <TrustBar />
      <Services />
      <Process />
      <WhyChoose />
      <Academy />
      <Testimonials />
      <Resources />
      <CTABanner />
    </main>
  );
}
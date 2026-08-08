import { About } from '@/components/About';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { aboutImages } from '@/data/content';

export function AboutPage() {
  return (
    <main>
      <Breadcrumbs
        backgroundImage={aboutImages.header}
        heading="About Us"
        items={[{ label: 'About' }]}
      />
      <About />
    </main>
  );
}
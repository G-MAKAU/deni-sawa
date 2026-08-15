import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Landmark, Briefcase, TrendingUp, BadgeCheck } from 'lucide-react';
import { site } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { MediaBand } from '@/components/MediaBand';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Experience & Track Record | Deni Sawa',
  description:
    'Senior banking, restructuring, governance and advisory experience — plus the professional credentials that back the Deni Sawa method.',
  alternates: { canonical: `${site.url}/about/experience` },
};

const trackRecord = [
  { icon: Landmark, stat: '20+ yrs', label: 'Combined senior banking & credit experience', text: 'Lending, credit risk, NPL management and restructurings across the region.' },
  { icon: Briefcase, stat: '100+', label: 'Special situations navigated', text: 'From early distress detection to full recovery — as bankers, operators and advisors.' },
  { icon: TrendingUp, stat: 'Portfolio-wide', label: 'Recovery & governance outcomes', text: 'Restructuring plans, governance resets and performance turnarounds delivered.' },
  { icon: BadgeCheck, stat: 'Board-level', label: 'Credentials & representation', text: 'Chartered and institutional qualifications, with board and investor representation experience.' },
];

export default function ExperiencePage() {
  return (
    <>
      <PageHero
        eyebrow="About · Experience"
        title="A track record built in the room."
        subtitle="Senior roles across banking, restructuring, governance and advisory — the experience the hardest situations demand."
        crumbs={[{ label: 'About', href: '/about' }, { label: 'Experience' }]}
        image={{ src: '/images/experience.jpg', alt: 'Deni Sawa experience' }}
      />

      <section className="section-pad bg-background">
        <div className="container-lux">
          <SectionHeading eyebrow="Track record" title="The numbers behind the method" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trackRecord.map((item, i) => (
              <Reveal key={item.label} delay={i * 80} className="h-full">
                <div className="card-elevated flex h-full flex-col p-7">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-growth/10 text-growth">
                    <item.icon className="h-6 w-6" strokeWidth={1.8} />
                  </span>
                  <p className="mt-5 font-display text-3xl font-semibold text-foreground">{item.stat}</p>
                  <p className="mt-1 text-sm font-semibold text-brand">{item.label}</p>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-bgalt">
        <div className="container-lux grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Where we have served"
              title="The rooms we know"
              description="Our experience spans commercial banking, distressed asset management, professional services and board-level governance — the combination required when a situation turns serious."
            />
          </div>
          <Reveal>
            <ul className="grid gap-4">
              {[
                'Commercial and corporate banking — credit, risk and relationship',
                'Distressed asset management and NPL resolution',
                'Restructuring and turnaround advisory',
                'Board-level governance and financial oversight',
                'Founder, family-office and investor advisory',
                'Fractional CFO and CEO operating roles',
              ].map((area, i) => (
                <li key={area} className="flex items-center gap-4 rounded-lg border border-card-border bg-card p-5">
                  <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-brand/10 font-mono text-xs font-bold text-brand">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[15px] text-foreground">{area}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <MediaBand src="/images/network-forum.jpg" alt="Experience in action" caption="Credentialed. Experienced. Accountable." height="md" />

      <CTASection
        title="Bring us your situation"
        subtitle="If we are not the right fit, we will tell you — and point you to someone who is."
        primary={{ label: 'Contact Us', href: '/contact' }}
      />
    </>
  );
}

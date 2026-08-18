import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Users, MessageSquareQuote, GraduationCap, Linkedin, Handshake } from 'lucide-react';
import { site, networkBenefits } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { MediaBand } from '@/components/MediaBand';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'SpecialSit Network | Peer Forums, Mentorship & Deal Flow | Deni Sawa',
  description:
    'A members-only community for operators, bankers, advisors and investors working in and around special situations — candid peer forums, mentorship and curated deal flow.',
  alternates: { canonical: `${site.url}/about/specialsit-network` },
};

const pillars = [
  { icon: MessageSquareQuote, title: 'Peer Forums', text: 'Candid, confidential exchange with operators who have been where you are.' },
  { icon: Users, title: 'Mentorship', text: 'Direct access to seasoned bankers, operators and turnaround professionals.' },
  { icon: Linkedin, title: 'Deal & Investor Flow', text: 'Curated introductions for qualifying members — capital, mandates and talent.' },
  { icon: GraduationCap, title: 'Learning', text: 'Member-only sessions, case studies and materials from real special situations.' },
];

const groups = [
  { title: 'For Operators', text: 'Business owners and executives steering through distress, turnaround or rapid change.' },
  { title: 'For Professionals', text: 'Accountants, lawyers, insolvency practitioners and advisors with client situations.' },
  { title: 'For Investors & Lenders', text: 'Banks, funds and investors who need credible counterparties and early signals.' },
];

export default function SpecialSitNetworkPage() {
  return (
    <>
      <PageHero
        eyebrow="SpecialSit Network"
        title="The room where special situations get solved."
        subtitle="A members-only community connecting operators, professionals, investors and lenders working in and around distressed and high-stakes situations."
        crumbs={[{ label: 'About', href: '/about' }, { label: 'SpecialSit Network' }]}
        image={{ src: '/images/network.jpg', alt: 'SpecialSit Network community' }}
      >
        <Button asChild size="lg">
          <Link href="/contact?subject=SpecialSit%20Network%20Membership">Request Membership</Link>
        </Button>
      </PageHero>

      {/* Benefits */}
      <section className="section-pad bg-background">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Membership value"
            title="Why join"
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {networkBenefits.map((benefit, i) => (
              <Reveal key={benefit} delay={i * 60} className="h-full">
                <div className="card-elevated flex h-full flex-col p-7">
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-growth/10 text-growth">
                    <Handshake className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <p className="text-[15px] leading-relaxed text-foreground">{benefit}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Four pillars */}
      <section className="section-pad bg-bgalt">
        <div className="container-lux">
          <SectionHeading
            eyebrow="How it works"
            title="Four pillars of the network"
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar, i) => (
              <Reveal key={pillar.title} delay={i * 80} className="h-full">
                <div className="card-elevated flex h-full flex-col p-7">
                  <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <pillar.icon className="h-6 w-6" strokeWidth={1.8} />
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">{pillar.title}</h3>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">{pillar.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <MediaBand src="/images/network-forum.jpg" alt="SpecialSit Network forum" caption="Candid. Credentialed. Confidential." height="md" />

      {/* Who it is for */}
      <section className="section-pad bg-background">
        <div className="container-lux">
          <SectionHeading eyebrow="Who it is for" title="Built for three kinds of members" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {groups.map((group, i) => (
              <Reveal key={group.title} delay={i * 80} className="h-full">
                <div className="flex h-full flex-col rounded-lg border border-card-border bg-card p-8">
                  <span className="font-mono text-sm font-bold text-brand">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-4 text-h3 font-semibold text-foreground">{group.title}</h3>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">{group.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Button asChild size="lg">
              <Link href="/contact?subject=SpecialSit%20Network%20Membership">
                Request an Invitation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <CTASection
        title="You are only as strong as the room you are in"
        subtitle="Join a network that has navigated the situations you are facing."
        primary={{ label: 'Request Membership', href: '/contact?subject=SpecialSit%20Network%20Membership' }}
      />
    </>
  );
}

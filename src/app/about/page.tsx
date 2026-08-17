import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Compass, Users, Award } from 'lucide-react';
import { site } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { MediaBand } from '@/components/MediaBand';
import { BlogInsightsSection } from '@/components/blog/BlogInsightsSection';
import { getBlogPosts } from '@/lib/supabase/queries';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'About Us | Deni Sawa Partners',
  description:
    'Deni Sawa Partners is an AI-enabled advisory and fractional business support firm helping organisations move from Special Situations to Best-in-Class.',
  alternates: { canonical: `${site.url}/about` },
};

const subPages = [
  {
    icon: Users,
    title: 'Leadership',
    description: 'The team behind the method — bankers, operators and advisors who have lived the situations.',
    href: '/about/leadership',
    image: '/images/leadership.jpg',
  },
  {
    icon: Compass,
    title: 'Philosophy',
    description: 'How we think and work — candour, discipline, and the belief that distress is reversible.',
    href: '/about/philosophy',
    image: '/images/philosophy.jpg',
  },
  {
    icon: Award,
    title: 'Experience',
    description: 'Track record and credentials across banking, restructuring, governance and advisory.',
    href: '/about/experience',
    image: '/images/experience.jpg',
  },
];

export default async function AboutPage() {
  const insights = await getBlogPosts({ limit: 3 });

  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="Built in the special situations. Designed for the road ahead."
        subtitle="Deni Sawa Partners is an AI-enabled advisory and fractional business support firm. We help professionals, entrepreneurs and investors move from Special Situations to Best-in-Class."
        crumbs={[{ label: 'About' }]}
        image={{ src: '/images/about-team.jpg', alt: 'Deni Sawa Partners team' }}
      >
        <Button asChild size="lg">
          <Link href="/contact">Talk to the Team</Link>
        </Button>
      </PageHero>

      {/* Story */}
      <section className="section-pad bg-background">
        <div className="container-lux grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Our story"
              title="Discipline. Candour. A clear path forward."
            />
            <div className="space-y-4 text-[17px] leading-relaxed text-muted-foreground">
              <p>
                Deni Sawa Partners was founded on a simple observation: the hardest situations are where the best work gets
                done — but they are also where good advice is hardest to find. Banks, operators and investors all need
                people who have been in the room before.
              </p>
              <p>
                We are that room. A bench of seasoned bankers, operators and advisors — augmented by AI — helping
                organisations diagnose their situation honestly, and move deliberately from recovery to resilience,
                growth and Best-in-Class performance.
              </p>
              <p>
                Whether it is a free Health Check or a full advisory mandate, the method is the same:
                Diagnose, Evaluate, Negotiate, Implement, Sustain.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {['Banking & Restructuring', 'Fractional Leadership', 'AI-Enabled Advisory', 'Governance'].map((tag) => (
                <span key={tag} className="rounded-badge border border-card-border bg-bgalt px-4 py-1.5 text-xs font-medium text-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <Reveal>
            <div className="relative">
              <div className="absolute -right-5 -top-5 h-28 w-28 rounded-full border border-growth/25" />
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-card-border shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/strategy.jpg" alt="Deni Sawa Partners" className="h-full w-full object-cover" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="section-pad bg-bgalt">
        <div className="container-lux">
          <SectionHeading eyebrow="What we stand for" title="The values behind the method" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { title: 'Candour', text: 'We tell you what we see, not what you want to hear. Situations are fixed fastest when the truth is on the table early.' },
              { title: 'Discipline', text: 'Recovery and growth are processes, not wishes. We bring structure, cadence and accountability to every engagement.' },
              { title: 'Durability', text: 'We build systems and capability that outlast the engagement — so performance compounds after we leave.' },
            ].map((value, i) => (
              <Reveal key={value.title} delay={i * 80} className="h-full">
                <div className="card-elevated h-full p-8">
                  <span className="font-mono text-sm font-bold text-brand">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-4 text-h3 font-semibold text-foreground">{value.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{value.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <MediaBand src="/images/hero-3.jpg" alt="Deni Sawa Partners in session" caption="Candour · Discipline · Durability" height="md" />

      {/* Sub-pages */}
      <section className="section-pad bg-background">
        <div className="container-lux">
          <SectionHeading eyebrow="Explore" title="Go deeper" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {subPages.map((page, i) => (
              <Reveal key={page.title} delay={i * 80} className="h-full">
                <Link href={page.href} className="card-elevated group flex h-full flex-col overflow-hidden">
                  <div className="relative h-44 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={page.image} alt={page.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
                    <span className="absolute bottom-4 left-5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-md">
                      <page.icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-lg font-semibold text-foreground">{page.title}</h3>
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">{page.description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                      Learn more
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <BlogInsightsSection
        eyebrow="Blog insights"
        title="Perspectives from the team"
        subtitle="Practical thinking on debt, financial coaching, corporate wellness and money mindset — written by the Deni Sawa advisory bench."
        posts={insights}
        viewAllHref="/blog"
        viewAllLabel="View all articles"
        tone="alt"
      />

      <CTASection
        title="Let us bring the method to your situation"
        subtitle="From a free diagnosis to a full advisory bench — the path starts with a conversation."
        primary={{ label: 'Contact Us', href: '/contact' }}
      />
    </>
  );
}

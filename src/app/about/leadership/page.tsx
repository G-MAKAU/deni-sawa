import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Landmark, ShieldCheck, Scale, Briefcase, Building2 } from 'lucide-react';
import { site } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Leadership | The Team Behind the Method | Deni Sawa',
  description:
    'Meet the leadership behind Deni Sawa Partners — seasoned bankers, operators and advisors who have lived the special situations they now help clients navigate.',
  alternates: { canonical: `${site.url}/about/leadership` },
};

const credentials = [
  { icon: Landmark, title: 'Banking & Credit', text: 'Senior credit, risk and relationship roles across the banking sector — including workouts, NPLs and restructurings.' },
  { icon: ShieldCheck, title: 'Turnaround & Recovery', text: 'Distressed asset management and special-situations work — from first detection to sustainable recovery.' },
  { icon: Scale, title: 'Governance', text: 'Board-level governance, financial oversight and investor representation across public and private institutions.' },
  { icon: Briefcase, title: 'Executive Leadership', text: 'CFO, CEO and operating experience — both fractional and full-time — across growth and crisis cycles.' },
  { icon: Building2, title: 'Advisory', text: 'Deal-making, restructuring advisory and strategic counsel for institutions, funds and family offices.' },
];

export default function LeadershipPage() {
  return (
    <>
      <PageHero
        eyebrow="About · Leadership"
        title="People who have been in the room before."
        subtitle="Our team is drawn from senior banking, turnaround, governance and operating roles — the combination of disciplines the hardest situations demand."
        crumbs={[{ label: 'About', href: '/about' }, { label: 'Leadership' }]}
        image={{ src: '/images/leadership.jpg', alt: 'Deni Sawa leadership' }}
      />

      <section className="section-pad bg-background">
        <div className="container-lux">
          <SectionHeading
            eyebrow="The bench"
            title="A deliberately assembled team"
            description="We keep the bench lean and senior. Every engagement is led by someone who has sat on the other side of the table — a banker, an operator, or both."
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {credentials.map((item, i) => (
              <Reveal key={item.title} delay={i * 80} className="h-full">
                <div className="card-elevated flex h-full flex-col p-7">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <item.icon className="h-6 w-6" strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="hero-pattern section-pad bg-charcoal text-white">
        <div className="container-lux">
          <SectionHeading
            eyebrow="How we engage"
            title="Senior at every level"
            light
            description="No hand-offs to juniors. The person who leads your diagnosis is the person accountable for your outcome."
          />
          <div className="flex justify-center">
            <Button asChild size="lg">
              <Link href="/contact?subject=Leadership%20Inquiry">
                Speak With Leadership
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <CTASection
        title="Talk to someone who has navigated it"
        subtitle="Bring us your situation — we will tell you honestly what we see."
        primary={{ label: 'Get in Touch', href: '/contact' }}
      />
    </>
  );
}

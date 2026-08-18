import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';
import { business } from '@/data/content';
import { socialLinks } from '@/components/SocialLinks';
import { cn } from '@/lib/utils';
import { PageHero } from '@/components/PageHero';
import { ContactFormNew, ContactInfoNew } from '@/components/ContactFormNew';
import { CTASection } from '@/components/CTASection';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Contact Us | Deni Sawa Partners',
  description:
    'Talk to the Deni Sawa advisory team. Free, confidential consultation — call, email, WhatsApp or send an enquiry and we will take it from there.',
  alternates: { canonical: `${business.website}/contact` },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;
  const initialSubject = subject ? String(subject).slice(0, 120) : undefined;

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let us find a clear way forward."
        subtitle="A free, confidential conversation about your situation — no judgement, no obligation."
        crumbs={[{ label: 'Contact' }]}
        image={{ src: '/images/contact-hero.jpg', alt: 'Contact Deni Sawa Partners' }}
      >
        <Button asChild size="lg">
          <a href={`https://wa.me/${business.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
          </a>
        </Button>
      </PageHero>

      <section className="section-pad bg-background">
        <div className="container-lux grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-8">
            <div>
              <span className="eyebrow mb-4 text-brand">
                <span className="divider-accent" /> We are here for you
              </span>
              <h2 className="text-h2 font-semibold text-foreground">
                No judgement. Just a <span className="text-brand-gradient">clear way forward</span>.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Start with a no-obligation Clarity Call. Confidential. Focused entirely on your situation. Reach out in whatever way feels comfortable — we will take it from there.
              </p>
            </div>

            <ContactInfoNew />

            <div className="rounded-lg border border-brand/20 bg-brand/5 p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand text-white">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">Prefer instant messaging?</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chat with the assistant any time, or message us on WhatsApp for a quick response.
                  </p>
                </div>
              </div>
              <Link
                href={`https://wa.me/${business.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-btn border border-card-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-brand/50 hover:text-brand"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp Us
              </Link>
            </div>

            {/* Follow us */}
            <div className="rounded-lg border border-card-border bg-card p-6">
              <h3 className="font-semibold text-foreground">Follow Deni Sawa</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Insights, success stories and financial education across our channels.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {socialLinks.map(({ name, href, icon: Icon, ariaLabel, hoverClass }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={ariaLabel}
                    title={name}
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-lg border border-card-border bg-background text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
                      hoverClass
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
                <a
                  href={`mailto:${business.email}`}
                  aria-label="Email"
                  title="Email"
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-card-border bg-background text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-growth hover:bg-growth hover:text-white"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <ContactFormNew initialSubject={initialSubject} />
        </div>
      </section>

      <CTASection
        title="The best time to act was yesterday. The next best time is now."
        subtitle="Bring us your situation — we will tell you honestly what we see."
      />
    </>
  );
}

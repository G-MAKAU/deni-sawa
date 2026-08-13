'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ContactForm, ContactInfoCards } from '@/components/ContactSection';
import { CTABanner } from '@/components/CTABanner';
import { business } from '@/data/content';
import { HeartHandshake, MessageCircle } from 'lucide-react';

export function ContactPage() {
  return (
    <main>
      <Breadcrumbs
        backgroundImage="/images/contact-hero.jpg"
        heading="Contact Us"
        items={[{ label: 'Contact' }]}
      />

      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute -top-40 left-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.06),transparent_70%)] -z-10" />
        <div className="container-lux">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="eyebrow mb-5 justify-center"><HeartHandshake className="h-3.5 w-3.5" />We Are Here For You</span>
            <h2 className="section-heading mb-5">
              No judgement. Just a <span className="text-brand-gradient">clear way forward</span>
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Your first consultation is completely free. Reach out in whatever way feels comfortable —
              we will take it from there.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-6">
              <ContactInfoCards />
              <div className="rounded-3xl border border-brand/25 bg-brand/5 p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-base font-bold text-foreground">Prefer instant messaging?</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Chat with the Deni Sawa assistant any time, or reach us directly on WhatsApp for a quick response.
                </p>
                <a
                  href={`https://wa.me/${business.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-brand-outline text-sm"
                >
                  <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                </a>
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      <CTABanner />
    </main>
  );
}
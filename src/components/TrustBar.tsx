'use client';

import { Reveal } from '@/components/Reveal';
import { partners } from '@/data/content';

export function TrustBar() {
  return (
    <section className="py-12 border-y border-border bg-muted/30">
      <div className="container-lux">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-8">
            Trusted by individuals, businesses & strategic partners
          </p>
        </Reveal>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 lg:gap-x-16">
          {partners.map((partner, i) => (
            <Reveal key={partner} delay={i * 80}>
              <div className="group flex items-center gap-2 cursor-default">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all duration-300 ${i % 2 === 0 ? 'group-hover:bg-brand group-hover:text-white' : 'group-hover:bg-green group-hover:text-white'}`}>
                  <span className="font-heading text-xs font-bold">
                    {partner.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <span className={`font-heading text-base font-semibold text-muted-foreground/70 transition-colors duration-300 ${i % 2 === 0 ? 'group-hover:text-brand' : 'group-hover:text-green'}`}>
                  {partner}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

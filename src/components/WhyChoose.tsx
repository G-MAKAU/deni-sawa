'use client';

import { ShieldCheck, Users, TrendingDown, HeartHandshake, Target, Sparkles, type LucideIcon } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { whyChoose } from '@/data/content';

const iconMap: Record<string, LucideIcon> = { ShieldCheck, Users, TrendingDown, HeartHandshake, Target, Sparkles };

export function WhyChoose() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-sm bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.05),transparent_70%)] -z-10" />
      <div className="container-lux">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Reveal><div className="eyebrow mb-5 mx-auto"><ShieldCheck className="h-3.5 w-3.5" />Why Deni Sawa</div></Reveal>
          <Reveal delay={100}>
            <h2 className="section-heading mb-5">
              Experience you can <span className="text-brand-gradient">trust</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Professional, ethical, successful, and sustainable — the four pillars that guide everything we do.
            </p>
          </Reveal>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyChoose.map((item, i) => {
            const Icon = iconMap[item.icon];
            const isGreen = i % 3 === 1;
            return (
              <Reveal key={item.title} delay={(i % 3) * 120} direction="up">
                <div className={`group relative h-full card-elevated overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-soft-lg`}>
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${isGreen ? 'from-green to-green-400' : 'from-brand to-brand-400'}`} />
                  <div className="p-1">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${
                        isGreen
                          ? 'bg-green/10 text-green group-hover:bg-green group-hover:text-white'
                          : 'bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white'
                      }`}>
                        {Icon && <Icon className="h-6 w-6" strokeWidth={1.8} />}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-heading text-lg font-bold mb-1 transition-colors duration-300 ${isGreen ? 'group-hover:text-green' : 'group-hover:text-brand'}`}>
                          {item.title}
                        </h3>
                        {/* Description: hidden by default, revealed on hover */}
                        <div className="overflow-hidden max-h-0 opacity-0 transition-all duration-500 ease-out group-hover:max-h-40 group-hover:opacity-100">
                          <p className="text-sm text-muted-foreground leading-relaxed mt-2">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Decorative corner accent */}
                  <div className={`absolute bottom-0 right-0 h-20 w-20 rounded-tl-3xl opacity-0 transition-all duration-500 group-hover:opacity-5 ${isGreen ? 'bg-green' : 'bg-brand'}`} />
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

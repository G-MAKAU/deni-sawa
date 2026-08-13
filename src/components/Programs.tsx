'use client';

import { CheckCircle2, Calendar, ArrowRight, Crown, Rocket, Sparkles, type LucideIcon } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { programs } from '@/data/content';
import { cn } from '@/lib/utils';

const tierIcons: LucideIcon[] = [Rocket, Sparkles, Crown];

export function Programs() {
  return (
    <section id="programs" className="relative overflow-hidden py-24 lg:py-32 bg-ink-900">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.08),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.10),transparent_70%)]" />
      </div>
      <div className="container-lux">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Reveal>
            <div className="eyebrow-dark mb-5 justify-center"><Calendar className="h-3.5 w-3.5" />Our Programmes</div>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold leading-tight text-white mb-5">
              Three paths to a <span className="text-brand-gradient">debt-free future</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-lg text-white/60 leading-relaxed">
              Structured advisory and coaching programmes designed around your goals — from your first 12-week plan
              to a full 48-week transformation.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {programs.map((program, i) => {
            const Icon = tierIcons[i] ?? Sparkles;
            const featured = i === 2;
            const isGreen = i === 1;
            return (
              <Reveal key={program.title} delay={i * 120} direction="up">
                <div
                  className={cn(
                    'relative flex h-full flex-col overflow-hidden rounded-4xl border p-8 transition-all duration-300 hover:-translate-y-1.5',
                    featured
                      ? 'border-brand/40 bg-gradient-to-b from-brand/15 via-white/5 to-white/[0.02] shadow-brand-glow'
                      : 'border-white/10 bg-white/[0.04]'
                  )}
                >
                  {featured && (
                    <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                      <Crown className="h-3 w-3" /> Flagship
                    </span>
                  )}

                  <div
                    className={cn(
                      'mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-500 group-hover:scale-110',
                      isGreen ? 'bg-gradient-to-br from-green to-green-600' : 'bg-gradient-to-br from-brand to-brand-600'
                    )}
                  >
                    <Icon className="h-7 w-7" strokeWidth={1.8} />
                  </div>

                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={cn('text-[11px] font-bold uppercase tracking-widest', isGreen ? 'text-green' : 'text-brand')}>
                      {program.category}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-white/50">
                      {program.format}
                    </span>
                  </div>

                  <h3 className="font-heading text-2xl font-extrabold text-white mb-1">{program.title}</h3>
                  <div className="mb-5 flex items-center gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">{program.duration}</span>
                  </div>

                  <p className="mb-6 text-sm leading-relaxed text-white/60">{program.description}</p>

                  <ul className="mb-8 space-y-2.5">
                    {program.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-white/70">
                        <CheckCircle2 className={cn('mt-0.5 h-4 w-4 flex-shrink-0', isGreen ? 'text-green' : 'text-brand')} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <a
                    href="/contact"
                    className={cn(
                      'mt-auto inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all duration-300 active:scale-95',
                      featured
                        ? 'bg-brand text-white shadow-brand-sm hover:bg-brand-600 hover:shadow-brand-glow'
                        : 'border border-white/20 bg-white/5 text-white hover:border-brand/50 hover:text-brand'
                    )}
                  >
                    Book This Programme <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={200}>
          <p className="mt-10 text-center text-sm text-white/50">
            Pricing is transparent and tailored to your situation — shared during your free first consultation.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
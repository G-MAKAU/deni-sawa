'use client';

import {
  Target, Eye, Quote, HeartHandshake, Users, ShieldCheck, TrendingDown, Sparkles, Compass, ArrowRight, BadgeCheck,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { Counter } from '@/components/Counter';
import { business, timeline, stats, whyChoose, partners, aboutImages } from '@/data/content';
import { cn } from '@/lib/utils';

const principleIcons = [ShieldCheck, Users, TrendingDown, HeartHandshake];

export function About() {
  return (
    <section id="about" className="py-24 lg:py-32 relative overflow-hidden bg-muted/20">
      <div className="absolute top-1/4 left-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.05),transparent_70%)] -z-10" />
      <div className="absolute bottom-1/3 right-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.05),transparent_70%)] -z-10" />

      <div className="container-lux">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left — sticky visual */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <Reveal direction="left">
              <div className="relative">
                <div className="relative rounded-5xl overflow-hidden shadow-soft-lg border border-border aspect-[4/5]">
                  <img
                    src={aboutImages.visual}
                    alt="Deni Sawa advisory team at work"
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand px-3.5 py-1.5 text-xs font-bold text-white shadow-brand-glow">
                      <Quote className="h-3.5 w-3.5" />
                      {business.name}
                    </div>
                    <p className="text-sm text-white/85 leading-relaxed">{business.description}</p>
                  </div>
                </div>

                <div className="absolute -bottom-6 -right-5 glass-light rounded-3xl p-5 max-w-[210px] shadow-soft-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-600 text-white">
                      <Target className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-heading text-2xl font-bold text-brand"><Counter target={20} suffix="+ yrs" /></div>
                      <div className="text-xs text-muted-foreground">Of Experience</div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right — content */}
          <div className="lg:col-span-7 space-y-12">
            <div className="max-w-2xl">
              <Reveal>
                <div className="eyebrow mb-5"><Compass className="h-3.5 w-3.5" />About Deni Sawa</div>
              </Reveal>
              <Reveal delay={100}>
                <h2 className="section-heading mb-6">{business.aboutHeadline}</h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">{business.aboutIntro}</p>
              </Reveal>
              <Reveal delay={300}>
                <p className="text-base text-muted-foreground leading-relaxed">
                  At <span className="font-semibold text-brand">Deni Sawa</span>, we understand the weight that debt
                  can carry. Whether you're avoiding a crisis or already navigating one, we stand beside you with honest
                  guidance, practical resources, and steady support for the journey ahead.
                </p>
              </Reveal>
              <Reveal delay={400}>
                <p className="text-base text-muted-foreground leading-relaxed mt-4">
                  We are Christian-based, and our principles are grounded in Biblical teaching — serving God and
                  humankind with integrity, which makes this work deeply meaningful to us.
                </p>
              </Reveal>

              <Reveal delay={500}>
                <div className="mt-8 flex flex-wrap gap-2.5">
                  {partners.map((p) => (
                    <span key={p} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                      <BadgeCheck className="h-3.5 w-3.5 text-brand" />
                      {p}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Vision & Mission */}
            <div className="grid sm:grid-cols-2 gap-5">
              <Reveal direction="left">
                <div className="group rounded-4xl border border-green/20 bg-green/5 p-7 transition-all duration-300 hover:shadow-soft-md hover:-translate-y-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green text-white mb-4"><Eye className="h-5 w-5" /></div>
                  <h3 className="font-heading text-lg font-bold mb-2 flex items-center gap-2">Vision<span className="text-green text-xs font-semibold">· Aspiration</span></h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{business.vision}</p>
                </div>
              </Reveal>
              <Reveal direction="right">
                <div className="group rounded-4xl border border-border bg-card p-7 transition-all duration-300 hover:shadow-soft-md hover:-translate-y-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/20 mb-4"><Target className="h-5 w-5" /></div>
                  <h3 className="font-heading text-lg font-bold mb-2 flex items-center gap-2">Mission<span className="text-brand text-xs font-bold uppercase tracking-widest">· Purpose</span></h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{business.mission}</p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width story image band */}
      <div className="relative mt-16 lg:mt-24 overflow-hidden">
        <Reveal>
          <div className="relative">
            <img
              src={aboutImages.story}
              alt="Guiding clients toward financial freedom"
              className="w-full h-[32rem] sm:h-[36rem] md:h-[42rem] lg:h-[48rem] object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-ink-950/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 via-ink-950/40 to-transparent" />
            <div className="absolute inset-0 flex items-center px-5 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16">
              <div className="max-w-xl lg:max-w-2xl">
                <div className="eyebrow-dark mb-4 inline-flex">Our Story</div>
                <p className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-snug">
                  Seasoned bankers with far-reaching experience in banking, debt management,
                  finance, risk, and capital raising — here for you.
                </p>
                <p className="mt-4 max-w-xl text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed">
                  {business.partners}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="container-lux">
        <div className="mt-16 lg:mt-24 space-y-16 lg:space-y-20">

            {/* Stats band */}
            <Reveal>
              <div className="relative overflow-hidden rounded-4xl border border-border bg-card p-8 shadow-soft">
                <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.12),transparent_72%)]" />
                <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.12),transparent_72%)]" />
                <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6">
                  {stats.map((stat, i) => (
                    <div key={stat.label} className="text-center">
                      <div className={cn('font-heading text-3xl md:text-4xl font-extrabold', i % 2 === 1 ? 'text-green' : 'text-brand')}>
                        <Counter target={stat.value} suffix={stat.suffix} />
                      </div>
                      <div className="mt-1.5 text-xs font-medium text-foreground/70 leading-snug">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Guiding principles */}
            <div>
              <Reveal>
                <div className="flex items-center gap-3 mb-7">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand"><Sparkles className="h-4.5 w-4.5" /></span>
                  <h3 className="font-heading text-2xl font-bold">What Guides Us</h3>
                </div>
              </Reveal>
              <div className="grid sm:grid-cols-2 gap-5">
                {whyChoose.slice(0, 4).map((item, i) => {
                  const IconP = principleIcons[i] ?? Sparkles;
                  const isGreen = i % 2 === 1;
                  return (
                    <Reveal key={item.title} delay={i * 80} direction="up">
                      <div className={cn('h-full rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-md', isGreen ? 'border-green/20 bg-green/5 hover:border-green/40' : 'border-border bg-card hover:border-brand/30')}>
                        <div className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md', isGreen ? 'bg-gradient-to-br from-green to-green-600' : 'bg-gradient-to-br from-brand to-brand-600')}>
                          <IconP className="h-5 w-5" />
                        </div>
                        <h4 className="font-heading text-base font-bold mb-1.5">{item.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>

            {/* Journey timeline */}
            <div>
              <Reveal>
                <div className="flex items-center gap-3 mb-7">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand"><Compass className="h-4.5 w-4.5" /></span>
                  <h3 className="font-heading text-2xl font-bold">Our Journey</h3>
                </div>
              </Reveal>
              <div className="relative">
                <div className="absolute left-[15px] sm:left-4 top-2 bottom-2 w-px bg-gradient-to-b from-brand via-green to-brand opacity-30" />
                <div className="space-y-6">
                  {timeline.map((item, i) => (
                    <Reveal key={i} delay={i * 100} direction="left">
                      <div className="relative pl-14">
                        <div className={cn('absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-card text-xs font-bold shadow-soft', i % 2 === 0 ? 'border-brand text-brand' : 'border-green text-green')}>{i + 1}</div>
                        <div className="rounded-3xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-soft hover:border-brand/20">
                          <div className={cn('text-xs font-semibold uppercase tracking-widest mb-1', i % 2 === 0 ? 'text-brand' : 'text-green')}>{item.year}</div>
                          <h4 className="font-heading text-base font-bold mb-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>

            {/* Call to action */}
            <Reveal>
              <div className="relative overflow-hidden rounded-sm border border-green/25 bg-gradient-to-br from-green via-green-600 to-green-800 p-10 lg:p-14 text-center shadow-soft-lg">
                <div className="absolute inset-0">
                  <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_72%)]" />
                  <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.12),transparent_72%)]" />
                </div>
                <div className="relative">
                  <h3 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3">
                    Ready to take the next step?
                  </h3>
                  <p className="text-white/80 max-w-xl mx-auto mb-8 text-sm sm:text-base">
                    Book a consultation and begin your journey to financial freedom.
                  </p>
                  <a
                    href="/contact"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-sm bg-white text-brand px-10 py-4 text-base sm:text-lg font-bold shadow-soft-lg transition-all duration-300 hover:bg-ink-50 hover:scale-[1.02] active:scale-95"
                  >
                    Get Started <ArrowRight className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </Reveal>
        </div>
      </div>
    </section>
  );
}
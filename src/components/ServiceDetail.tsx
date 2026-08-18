'use client';

import { useState } from 'react';
import {
  CheckCircle2, Calendar, ArrowRight, ChevronDown, Sparkles, Phone,
  Landmark, GraduationCap, Building2, Briefcase, Brain,
  BookOpen as BookOpenIcon, type LucideIcon,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { ServiceNavigator } from '@/components/ServiceNavigator';
import { services, business } from '@/data/content';
import { cn } from '@/lib/utils';

type Service = (typeof services)[number];

const iconMap: Record<string, LucideIcon> = { Landmark, GraduationCap, BookOpen: BookOpenIcon, Building2, Briefcase, Brain };

interface ServiceDetailProps {
  service: Service;
}

export function ServiceDetail({ service }: ServiceDetailProps) {
  const Icon = iconMap[service.icon] ?? Landmark;
  const index = services.findIndex((s) => s.slug === service.slug);
  const isSchedule = service.cta === 'schedule';

  return (
    <>
      {/* Overview */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute -top-40 right-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.06),transparent_70%)] -z-10" />
        <div className="container-lux">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-14">
            <div>
              <Reveal>
                <div className="mb-4 flex items-center gap-3">
                  <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md', index % 2 === 1 ? 'bg-green' : 'bg-brand')}>
                    {Icon && <Icon className="h-6 w-6" strokeWidth={1.8} />}
                  </span>
                  <span className={cn('text-[11px] font-bold uppercase tracking-[0.16em]', index % 2 === 1 ? 'text-green' : 'text-brand')}>
                    Division 0{index + 1} of {services.length}
                  </span>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <h1 className="mb-5 font-heading text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  {service.title}
                </h1>
              </Reveal>
              <Reveal delay={200}>
                <p className="mb-6 text-lg leading-relaxed text-foreground/90">{service.summary}</p>
              </Reveal>
              <Reveal delay={250}>
                <p className="mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">{service.overview}</p>
              </Reveal>

              <Reveal delay={300}>
                <div className="flex flex-wrap items-center gap-3">
                  {isSchedule ? (
                    <a href="/contact" className="btn-brand text-sm whitespace-nowrap">
                      <Calendar className="h-4 w-4" /> Schedule a Free Consultation <ArrowRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <a href="/academy" className="btn-brand text-sm whitespace-nowrap">
                      <BookOpenIcon className="h-4 w-4" /> Explore Related Learning <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                  <a href={`tel:${business.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand">
                    <Phone className="h-4 w-4" /> {business.phone}
                  </a>
                </div>
              </Reveal>
            </div>

            <Reveal delay={200} direction="right">
              <div className="rounded-4xl border border-border bg-card p-7 shadow-soft sm:p-9">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <h3 className="font-heading text-lg font-bold">At a glance</h3>
                  <ServiceNavigator activeSlug={service.slug} compact />
                </div>
                <ul className="space-y-4">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className={cn('mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full', index % 2 === 1 ? 'bg-green/15 text-green' : 'bg-brand/15 text-brand')}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium text-foreground/90">{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="my-6 h-px bg-border" />
                <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Who it is for</div>
                <div className="flex flex-wrap gap-2">
                  {service.idealFor.map((item) => (
                    <span key={item} className="rounded-full border border-border bg-ink-25 px-3 py-1 text-xs font-medium text-muted-foreground dark:bg-ink-800">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative overflow-hidden bg-ink-900 py-20 lg:py-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.12),transparent_72%)]" />
          <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.12),transparent_72%)]" />
        </div>
        <div className="container-lux">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Reveal><div className="eyebrow-dark mb-5 justify-center"><Sparkles className="h-3.5 w-3.5" />How We Help</div></Reveal>
            <Reveal delay={100}>
              <h2 className="font-heading text-4xl font-extrabold leading-tight text-white">
                What the {service.tab} division <span className="text-brand-gradient">delivers</span>
              </h2>
            </Reveal>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {service.features.map((feature, i) => (
              <Reveal key={feature.title} delay={(i % 2) * 120} direction={i % 2 === 0 ? 'left' : 'right'}>
                <div className="group h-full rounded-4xl border border-white/10 bg-white/[0.04] p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand/40">
                  <div className={cn('mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-white transition-transform duration-500 group-hover:scale-110', i % 2 === 1 ? 'bg-gradient-to-br from-green to-green-600' : 'bg-gradient-to-br from-brand to-brand-600')}>
                    <CheckCircle2 className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                  <h3 className="mb-3 font-heading text-lg font-bold text-white">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-white/60">{feature.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Deliverables + ideal for */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="container-lux">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <Reveal direction="left">
              <div className="rounded-4xl border border-border bg-card p-8 shadow-soft sm:p-10">
                <h3 className="mb-6 font-heading text-2xl font-extrabold">What you get</h3>
                <ul className="space-y-4">
                  {service.deliverables.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className={cn('mt-0.5 h-5 w-5 flex-shrink-0', index % 2 === 1 ? 'text-green' : 'text-brand')} />
                      <span className="font-medium text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal direction="right">
              <div className="rounded-4xl border border-green/20 bg-green/5 p-8 sm:p-10">
                <h3 className="mb-6 font-heading text-2xl font-extrabold">Designed for</h3>
                <div className="flex flex-wrap gap-2.5">
                  {service.idealFor.map((item) => (
                    <span key={item} className="rounded-full border border-green/25 bg-green/10 px-4 py-2 text-sm font-semibold text-green-700 dark:text-green">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                  Not sure if this is the right fit? Book a free consultation and our team will point you to the
                  division that matches your goals.
                </p>
                <a href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-green transition-all duration-300 hover:gap-3">
                  Book a free consultation <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <ServiceFaq service={service} index={index} />

      {/* Programme band */}
      <section className="pb-20 lg:pb-28">
        <div className="container-lux">
          <Reveal direction="scale">
            <div className="relative overflow-hidden rounded-5xl border border-border bg-gradient-to-br from-ink-900 via-ink-800 to-ink-950 p-10 text-center sm:p-14">
              <div className="absolute -top-24 left-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.16),transparent_72%)]" />
              <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.12),transparent_72%)]" />
              <div className="relative">
                <h2 className="mb-4 font-heading text-3xl font-extrabold text-white sm:text-4xl">
                  Ready to begin your <span className="text-brand-gradient">{service.tab} journey?</span>
                </h2>
                <p className="mx-auto mb-8 max-w-xl text-base text-white/60">
                  Explore our structured 12, 24 and 48-week programmes, or speak to an advisor today — start with a
                  no-obligation Clarity Call.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <a href="/services#programs" className="btn-brand text-sm">
                    <BookOpenIcon className="h-4 w-4" /> View Our Programmes <ArrowRight className="h-4 w-4" />
                  </a>
                  <a href="/contact" className="btn-ghost-dark text-sm">
                    <Calendar className="h-4 w-4" /> Book a Consultation
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function ServiceFaq({ service, index }: { service: Service; index: number }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative overflow-hidden py-20 lg:py-24">
      <div className="absolute bottom-0 right-1/4 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.05),transparent_70%)] -z-10" />
      <div className="container-lux">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Reveal><div className="eyebrow mb-5 justify-center">Common Questions</div></Reveal>
          <Reveal delay={100}>
            <h2 className="section-heading">Everything you need to <span className="text-brand-gradient">know</span></h2>
          </Reveal>
        </div>

        <div className="mx-auto max-w-3xl space-y-3">
          {service.faqs.map((faq, i) => {
            const open = openIndex === i;
            return (
              <Reveal key={faq.q} delay={i * 80}>
                <div className={cn('overflow-hidden rounded-2xl border transition-colors', open ? 'border-brand/30 bg-card shadow-soft-md' : 'border-border bg-card')}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                  >
                    <span className="font-heading text-base font-bold text-foreground">{faq.q}</span>
                    <span className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300', open ? 'bg-brand text-white' : 'bg-ink-25 text-muted-foreground dark:bg-ink-800')}>
                      <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', open && 'rotate-180')} />
                    </span>
                  </button>
                  <div className={cn('grid transition-all duration-300', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
'use client';

import { useState } from 'react';
import {
  ArrowRight, Calendar, CheckCircle2, Landmark, GraduationCap, BookOpen, Building2, Briefcase, Brain,
  Phone, ArrowUpRight, type LucideIcon,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { services, business } from '@/data/content';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = { Landmark, GraduationCap, BookOpen, Building2, Briefcase, Brain };

export function Services() {
  const [activeIndex, setActiveIndex] = useState(0);
  const service = services[activeIndex] ?? services[0];
  const Icon = iconMap[service.icon];
  const isSchedule = service.cta === 'schedule';
  const isGreen = activeIndex % 3 === 1;
  const accentBg = isGreen ? 'bg-green' : 'bg-brand';

  return (
    <section id="services" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.05),transparent_70%)] -z-10" />
      <div className="absolute bottom-24 left-0 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.05),transparent_70%)] -z-10" />
      <div className="container-lux">
        <div className="max-w-2xl mb-12 mx-auto text-center">
          <Reveal>
            <div className="eyebrow mb-5 justify-center"><Landmark className="h-3.5 w-3.5" />Our Services</div>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="section-heading mb-5">
              Divisions that deliver <span className="text-brand-gradient">financial freedom</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Choose a division below to explore how we help individuals and businesses move forward with confidence.
            </p>
          </Reveal>
        </div>

        {/* Tabs — wrapped segmented control, all visible on any screen */}
        <Reveal delay={100}>
          <div className="flex max-w-full flex-wrap items-center justify-center gap-2.5 mb-10">
            {services.map((item, i) => {
              const ItemIcon = iconMap[item.icon] ?? Landmark;
              const active = i === activeIndex;
              const isGreen = i % 3 === 1;
              return (
                <button
                  key={item.title}
                  onClick={() => setActiveIndex(i)}
                  aria-selected={active}
                  role="tab"
                  className={cn(
                    'group flex min-w-0 items-center gap-2 rounded-full border px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap',
                    active
                      ? isGreen
                        ? 'border-green bg-green text-white shadow-lg shadow-green/30 ring-2 ring-green/40 ring-offset-2 ring-offset-background'
                        : 'border-brand bg-brand text-white shadow-lg shadow-brand/30 ring-2 ring-brand/40 ring-offset-2 ring-offset-background'
                      : 'border-border bg-card text-muted-foreground hover:border-brand/40 hover:text-brand hover:-translate-y-0.5'
                  )}
                >
                  <ItemIcon className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                  <span className="truncate">{item.tab}</span>
                  <span className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors duration-300', active ? 'bg-white' : 'bg-muted-foreground/40')} />
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Active service content */}
        <Reveal key={service.title} direction="up">
          <div className="grid lg:grid-cols-[0.9fr_1.15fr] gap-8 lg:gap-14">
            {/* Left — image */}
            <div className="relative h-full">
              <div className="absolute -inset-2 bg-gradient-to-br from-brand/15 via-transparent to-green/15" />
              <div className="relative h-full overflow-hidden shadow-soft-lg border border-border -ml-2 md:-ml-2 lg:-ml-8">
                <img
                  src={service.image}
                  alt={service.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white">
                  <span className={cn('h-2 w-2 rounded-full', accentBg)} />
                  {activeIndex + 1} of {services.length} divisions
                </div>
              </div>
            </div>

            {/* Right — content */}
            <div className="lg:pl-2">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl text-white', accentBg)}>
                  {Icon ? <Icon className="h-6 w-6" strokeWidth={1.8} /> : <Landmark className="h-6 w-6" />}
                </div>
                <span className={cn('text-[11px] font-bold uppercase tracking-[0.16em]', isGreen ? 'text-green' : 'text-brand')}>
                  Division 0{activeIndex + 1}
                </span>
              </div>

              <h3 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
                {service.title}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed mb-7">{service.summary}</p>

              <ul className="space-y-3.5 mb-9">
                {service.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <CheckCircle2 className={cn('h-5 w-5 flex-shrink-0 mt-0.5', activeIndex % 3 === 1 ? 'text-green' : 'text-brand')} />
                    <span className="text-foreground/90 font-medium">{point}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-3">
                {isSchedule ? (
                  <a href="#contact" className="btn-brand text-sm whitespace-nowrap">
                    <Calendar className="h-4 w-4" />
                    Schedule Consultation
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : (
                  <a href="#academy" className="btn-brand-outline text-sm whitespace-nowrap">
                    <BookOpen className="h-4 w-4" />
                    Learn About This Service
                    <ArrowRight className="h-4 w-4" />
                  </a>
                )}
                <a href={`tel:${business.phone.replace(/\s/g, '')}`} className="group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 hover:text-brand">
                  <Phone className="h-4 w-4" />
                  {business.phone}
                </a>
              </div>

              <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Use the tabs above to browse other divisions.
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
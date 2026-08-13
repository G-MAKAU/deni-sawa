'use client';

import { useState } from 'react';
import {
  Clock, Tag, ArrowRight, GraduationCap, Monitor, Users, Building2, BookOpen, BookMarked,
  type LucideIcon,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { academyCourses } from '@/data/content';
import { cn } from '@/lib/utils';

const formatIcons: Record<string, LucideIcon> = {
  'Workshop Series': Users,
  'Webinar': Monitor,
  'One-on-One': GraduationCap,
  'On-Site Training': Building2,
};

const categories = ['All', 'Coaching', 'Wellness', 'Debt Management', 'Corporate'];

export function AcademyCatalog() {
  const [active, setActive] = useState('All');
  const filtered = active === 'All' ? academyCourses : academyCourses.filter((c) => c.category === active);

  return (
    <section id="catalog" className="relative overflow-hidden py-24 lg:py-32">
      <div className="absolute bottom-0 left-1/4 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.06),transparent_70%)] -z-10" />
      <div className="container-lux">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Reveal>
            <div className="eyebrow mb-5 justify-center"><BookMarked className="h-3.5 w-3.5" />Course Catalogue</div>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="section-heading mb-5">
              Choose the programme that <span className="text-brand-gradient">fits your journey</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Every course is practical, judgement-free, and built by seasoned financial professionals.
            </p>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-300',
                  active === cat
                    ? 'border-brand bg-brand text-white shadow-lg shadow-brand/30'
                    : 'border-border bg-card text-muted-foreground hover:border-brand/40 hover:text-brand'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((course, i) => {
            const FormatIcon = formatIcons[course.format] || BookOpen;
            const isGreen = i % 2 === 1;
            return (
              <Reveal key={course.title} delay={(i % 2) * 120} direction={i % 2 === 0 ? 'left' : 'right'}>
                <div className="group relative h-full overflow-hidden rounded-4xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg">
                  <div className={cn(
                    'absolute -top-24 -right-24 h-48 w-48 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100',
                    isGreen
                      ? 'bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.10),transparent_72%)]'
                      : 'bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.10),transparent_72%)]'
                  )} />
                  <div className="mb-6 flex items-center justify-between">
                    <div className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110',
                      isGreen ? 'bg-brand/15 text-brand group-hover:bg-brand group-hover:text-white' : 'bg-green/15 text-green group-hover:bg-green group-hover:text-white'
                    )}>
                      <FormatIcon className="h-6 w-6" strokeWidth={1.8} />
                    </div>
                    <span className="rounded-full border border-border bg-ink-25 px-3 py-1 text-xs font-medium text-muted-foreground dark:bg-ink-800">
                      {course.level}
                    </span>
                  </div>

                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={cn('text-[11px] font-bold uppercase tracking-widest', isGreen ? 'text-brand' : 'text-green')}>
                      {course.category}
                    </span>
                  </div>
                  <h3 className="mb-3 font-heading text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-brand">
                    {course.title}
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{course.description}</p>

                  <div className="mb-6 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {course.duration}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Tag className="h-3.5 w-3.5" /> {course.format}
                    </div>
                  </div>

                  <a
                    href="/contact"
                    className={cn(
                      'inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 hover:gap-3',
                      isGreen ? 'text-brand' : 'text-green'
                    )}
                  >
                    Enrol Now <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
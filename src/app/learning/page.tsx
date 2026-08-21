import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, GraduationCap, Users, Route, MonitorPlay } from 'lucide-react';
import { site, learningPrograms, learningPathways } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { MediaBand } from '@/components/MediaBand';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';
import { cn } from '@/lib/utils';
import { getLmsCourses, type LmsCourse } from '@/lib/supabase/queries';
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd';

const STATIC_PATHWAY_SLUGS = new Set(['business-recovery', 'governance', 'financial-resilience']);

function courseHref(course: LmsCourse): string {
  return STATIC_PATHWAY_SLUGS.has(course.slug) ? `/learning/${course.slug}` : '/academy#catalog';
}

export const metadata: Metadata = {
  title: 'Learning Centre | Executive Programmes & Pathways | Deni Sawa',
  description:
    'Practitioner-led programmes and self-paced pathways that build financial intelligence, recovery skills, governance discipline and resilience.',
  alternates: { canonical: `${site.url}/learning` },
};

export default async function LearningPage() {
  let courses: LmsCourse[] = [];
  try {
    courses = await getLmsCourses();
  } catch {
    courses = [];
  }

  return (
    <>
      <BreadcrumbJsonLd items={[{ label: 'Home', href: '/' }, { label: 'Learning' }]} />
      <PageHero
        eyebrow="Learning Centre"
        title="Learn the numbers. Master the narrative. Lead with confidence."
        subtitle="Practitioner-led programmes for leaders, operators and teams — built from real special situations work, not textbooks."
        crumbs={[{ label: 'Learning' }]}
        image={{ src: '/images/learning-hero.jpg', alt: 'Deni Sawa Learning Centre' }}
      >
        <Button asChild size="lg">
          <Link href="/learning/executive-finance">Explore Executive Finance</Link>
        </Button>
      </PageHero>

      {/* Flagship programme */}
      <section className="section-pad bg-background">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Flagship programme"
            title="Executive Finance for Non-Finance Leaders"
            subtitle="Six modules. One capstone. Financial intelligence for leaders who own the decisions."
          />
          <Reveal>
            <div className="card-elevated overflow-hidden lg:grid lg:grid-cols-2">
              <div className="p-8 sm:p-10 lg:p-12">
                <span className="inline-flex items-center gap-2 rounded-badge bg-growth/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-growth">
                  <GraduationCap className="h-3.5 w-3.5" /> Cohort programme
                </span>
                <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-foreground">
                  {learningPrograms[0].title}
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">{learningPrograms[0].positioning}</p>
                <div className="mt-8 flex flex-wrap gap-2">
                  {learningPrograms[0].capabilities.map((cap) => (
                    <span key={cap} className="rounded-badge border border-card-border bg-bgalt px-3 py-1 text-xs font-medium text-foreground">
                      {cap}
                    </span>
                  ))}
                </div>
                <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <Button asChild size="lg">
                    <Link href="/learning/executive-finance">
                      View the Programme
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">{learningPrograms[0].format}</span>
                </div>
              </div>
              <div className="relative hidden min-h-[320px] lg:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/exec-finance.jpg" alt="Executive Finance cohort" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-card to-transparent" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pathways */}
      <section id="lms" className="section-pad bg-bgalt">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Learning pathways"
            title="Keep building beyond the classroom"
            subtitle="Short, focused pathways on the situations that matter most — available to members and programme alumni."
          />
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, i) => (
                <Reveal key={course.id} delay={i * 80} className="h-full">
                  <Link
                    href={courseHref(course)}
                    className="card-elevated group flex h-full flex-col overflow-hidden p-0 transition-transform duration-300 hover:-translate-y-1"
                  >
                    {course.image_url ? (
                      <div className="relative h-44 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={course.image_url}
                          alt={course.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-bgalt">
                        <GraduationCap className="h-10 w-10 text-brand/30" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-7">
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-growth">{course.category}</span>
                      <h3 className="mt-2 text-lg font-semibold text-foreground">{course.title}</h3>
                      <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">{course.description}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {[course.format, course.duration, course.level].filter(Boolean).map((meta) => (
                          <span key={meta}>{meta}</span>
                        ))}
                      </div>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                        Explore pathway
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {learningPathways.map((pathway, i) => (
              <Reveal key={pathway.title} delay={i * 80} className="h-full">
                {pathway.soon ? (
                  <div className="card-elevated flex h-full flex-col p-7 opacity-70">
                    <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <MonitorPlay className="h-6 w-6" strokeWidth={1.8} />
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">{pathway.title}</h3>
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">{pathway.description}</p>
                    <span className="mt-6 inline-flex w-fit rounded-badge bg-brand/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
                      Coming soon
                    </span>
                  </div>
                ) : (
                  <Link href={pathway.slug} className="card-elevated group flex h-full flex-col p-7 transition-transform duration-300 hover:-translate-y-1">
                    <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-growth/10 text-growth">
                      {i === 0 ? (
                        <Route className="h-6 w-6" strokeWidth={1.8} />
                      ) : i === 1 ? (
                        <Users className="h-6 w-6" strokeWidth={1.8} />
                      ) : (
                        <GraduationCap className="h-6 w-6" strokeWidth={1.8} />
                      )}
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">{pathway.title}</h3>
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">{pathway.description}</p>
                    <span className={cn('mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand')}>
                      Explore pathway
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </Link>
                )}
              </Reveal>
            ))}
          </div>
          )}
        </div>
      </section>

      <MediaBand
        src="/images/hero-4.jpg"
        alt="Learning session in progress"
        caption="Practitioner-led. Evidence-based. Action-oriented."
        height="md"
      />
      <CTASection
        title="Invest in your team's financial intelligence"
        subtitle="Talk to us about cohort bookings, in-house delivery and alumni pathways."
      />
    </>
  );
}

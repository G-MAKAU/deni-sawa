import { Clock, Tag, Monitor, ArrowRight, GraduationCap, BookOpen, Users, Building2, PlayCircle, Sparkles, type LucideIcon } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { academyCourses, lms } from '@/data/content';

const formatIcons: Record<string, LucideIcon> = {
  'Workshop Series': Users, 'Webinar': Monitor, 'One-on-One': GraduationCap, 'On-Site Training': Building2,
};

export function Academy() {
  return (
    <section id="academy" className="py-24 lg:py-32 relative overflow-hidden bg-ink-900">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.10),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.10),transparent_70%)]" />
      </div>
      <div className="container-lux">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <Reveal><div className="eyebrow-dark mb-5"><GraduationCap className="h-3.5 w-3.5" />Deni Sawa Academy</div></Reveal>
            <Reveal delay={100}>
              <h2 className="font-heading text-4xl lg:text-5xl font-extrabold leading-tight text-white mb-5">
                Featured Learning<span className="block text-brand-gradient mt-1">Programmes</span>
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-lg text-white/60 leading-relaxed">
                Coaching programmes, workshops, seminars, and webinars designed to build financial literacy and empower you for lasting independence.
              </p>
            </Reveal>
          </div>
          <Reveal delay={300}>
            <a href="#contact" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-brand/40">
              Explore All Programmes<ArrowRight className="h-4 w-4" />
            </a>
          </Reveal>
        </div>

        {/* LMS promo */}
        <Reveal delay={250}>
          <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-gradient-to-br from-brand/20 via-white/5 to-green/10 p-8 sm:p-10 mb-10">
            <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-green/20 blur-3xl" />
            <div className="relative grid lg:grid-cols-[auto_1fr_auto] gap-8 items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand text-white shadow-brand-glow">
                <PlayCircle className="h-10 w-10" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/15 px-3 py-1 mb-3">
                  <Sparkles className="h-3.5 w-3.5 text-brand" />
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-300">{lms.heading}</span>
                </div>
                <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white mb-2">{lms.freeCourseTitle}</h3>
                <p className="text-sm sm:text-base text-white/60 leading-relaxed max-w-2xl mb-4">{lms.freeCourseDesc}</p>
                <p className="text-sm text-white/50 leading-relaxed max-w-2xl">{lms.nextDesc}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {lms.nextClasses.map((cls) => (
                    <span key={cls} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">{cls}</span>
                  ))}
                </div>
              </div>
              <a
                href={lms.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-brand-sm transition-all duration-300 hover:bg-brand-600 hover:shadow-brand-glow active:scale-95"
              >
                Go to Learning Portal<ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {academyCourses.map((course, i) => {
            const FormatIcon = formatIcons[course.format] || BookOpen;
            const isGreen = i % 2 === 1;
            return (
              <Reveal key={course.title} delay={(i % 2) * 120} direction={i % 2 === 0 ? 'left' : 'right'}>
                <div className="group relative h-full card-dark overflow-hidden">
                  <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${isGreen ? 'bg-green/10' : 'bg-brand/10'}`} />
                  <div className="flex items-center justify-between mb-6">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110 ${isGreen ? 'bg-green/15 text-green group-hover:bg-green group-hover:text-white' : 'bg-brand/15 text-brand group-hover:bg-brand group-hover:text-white'}`}>
                      <FormatIcon className="h-6 w-6" strokeWidth={1.8} />
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">{course.level}</span>
                  </div>
                  <h3 className={`font-heading text-xl font-bold mb-3 text-white transition-colors duration-300 ${isGreen ? 'group-hover:text-green' : 'group-hover:text-brand'}`}>{course.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed mb-6">{course.description}</p>
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center gap-1.5 text-xs text-white/40"><Clock className="h-3.5 w-3.5" />{course.duration}</div>
                    <div className="flex items-center gap-1.5 text-xs text-white/40"><Tag className="h-3.5 w-3.5" />{course.category}</div>
                    <div className="flex items-center gap-1.5 text-xs text-white/40"><FormatIcon className="h-3.5 w-3.5" />{course.format}</div>
                  </div>
                  <a href="#contact" className={`inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 hover:gap-3 ${isGreen ? 'text-green' : 'text-brand'}`}>
                    Enrol Now<ArrowRight className="h-4 w-4" />
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

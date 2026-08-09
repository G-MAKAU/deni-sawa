'use client';

import { useState, useEffect, useCallback } from 'react';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { testimonials } from '@/data/content';

export function Testimonials() {
  const [active, setActive] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const next = useCallback(() => setActive((p) => (p + 1) % testimonials.length), []);
  const prev = useCallback(() => setActive((p) => (p - 1 + testimonials.length) % testimonials.length), []);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [autoPlay, next]);

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden bg-muted/20">
      <div className="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.05),transparent_70%)] -z-10" />
      <div className="container-lux">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Reveal><div className="eyebrow mb-5 mx-auto"><Star className="h-3.5 w-3.5" />Success Stories</div></Reveal>
          <Reveal delay={100}>
            <h2 className="section-heading">
              Real journeys, <span className="text-brand-gradient">real freedom</span>
            </h2>
          </Reveal>
        </div>
        <Reveal direction="scale">
          <div className="relative max-w-4xl mx-auto" onMouseEnter={() => setAutoPlay(false)} onMouseLeave={() => setAutoPlay(true)}>
            <div className="absolute -top-8 -left-4 lg:-left-8 text-brand/10 pointer-events-none">
              <Quote className="h-32 w-32" strokeWidth={1} fill="currentColor" />
            </div>
            <div className="relative overflow-hidden rounded-5xl">
              <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${active * 100}%)` }}>
                {testimonials.map((t, i) => (
                  <div key={i} className="w-full flex-shrink-0 px-1">
                    <div className="glass-light p-10 lg:p-14 text-center">
                      <div className="flex items-center justify-center gap-1 mb-6">
                        {[1,2,3,4,5].map((s) => <Star key={s} className={`h-5 w-5 ${s <= 4 ? 'fill-brand text-brand' : 'fill-green text-green'}`} />)}
                      </div>
                      <blockquote className="font-heading text-xl lg:text-2xl font-medium leading-relaxed text-foreground mb-8">"{t.quote}"</blockquote>
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-600 text-white font-heading text-lg font-bold shadow-brand-sm">
                          {t.author.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                        </div>
                        <div className="text-left">
                          <div className="font-heading font-bold text-foreground">{t.author}</div>
                          <div className="text-sm text-brand font-medium">{t.role}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-8">
              <button onClick={prev} className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-300 hover:border-brand hover:text-brand hover:shadow-soft" aria-label="Previous"><ChevronLeft className="h-5 w-5" /></button>
              <div className="flex items-center gap-2">
                {testimonials.map((_, i) => (
                  <button key={i} onClick={() => setActive(i)} className={`h-2 rounded-full transition-all duration-300 ${active === i ? 'w-8 bg-brand' : 'w-2 bg-border hover:bg-muted-foreground/50'}`} aria-label={`Go to testimonial ${i+1}`} />
                ))}
              </div>
              <button onClick={next} className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-300 hover:border-brand hover:text-brand hover:shadow-soft" aria-label="Next"><ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

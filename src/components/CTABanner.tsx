'use client';

import { Calendar, BookOpen, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

export function CTABanner() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="container-lux">
        <Reveal direction="scale">
          <div className="relative rounded-5xl overflow-hidden bg-gradient-to-br from-ink-900 via-ink-800 to-ink-950 p-12 lg:p-20 text-center">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.15),transparent_70%)]" />
              <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.10),transparent_70%)]" />
            </div>
            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand mb-6">
                <Sparkles className="h-3.5 w-3.5" />Start Your Journey
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white mb-6">
                Ready to start your journey to a
                <span className="block text-brand-gradient mt-2">financial free life?</span>
              </h2>
              <p className="text-lg text-white/60 leading-relaxed mb-10 max-w-2xl mx-auto">
                Reach out today and start your journey to financial freedom. Our team is ready to walk with you — every step of the way.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a href="#contact" className="btn-brand"><Calendar className="h-4 w-4" />Book Consultation</a>
                <a href="#academy" className="btn-ghost-dark"><BookOpen className="h-4 w-4" />Explore Learning Resources</a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

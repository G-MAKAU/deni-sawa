import { PhoneCall, MessagesSquare, ClipboardList, TrendingUp, ArrowRight, type LucideIcon } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { processSteps } from '@/data/content';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = { PhoneCall, MessagesSquare, ClipboardList, TrendingUp };

export function Process() {
  return (
    <section id="process" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.05),transparent_70%)] -z-10" />
      <div className="absolute bottom-0 right-1/4 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.05),transparent_70%)] -z-10" />
      <div className="container-lux">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <Reveal>
            <div className="eyebrow mb-5 justify-center"><TrendingUp className="h-3.5 w-3.5" />The Process</div>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="section-heading mb-5">
              Getting help is <span className="text-brand-gradient">simpler than you think</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Just four straightforward steps between where you are and where you want to be.
            </p>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {processSteps.map((step, i) => {
            const Icon = iconMap[step.icon] ?? PhoneCall;
            const isGreen = i % 2 === 1;
            return (
              <Reveal key={step.title} delay={(i % 4) * 110} direction="up">
                <div className="group relative h-full rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-md">
                  <div className="absolute top-6 right-6 font-heading text-4xl font-extrabold text-foreground/5 transition-colors duration-300 group-hover:text-brand/10">
                    {step.step}
                  </div>
                  <div className={cn('mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md transition-all duration-500 group-hover:scale-110', isGreen ? 'bg-gradient-to-br from-green to-green-600' : 'bg-gradient-to-br from-brand to-brand-600')}>
                    <Icon className="h-7 w-7" strokeWidth={1.8} />
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className={cn('text-[11px] font-bold uppercase tracking-widest', isGreen ? 'text-green' : 'text-brand')}>Step {step.step}</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={200}>
          <div className="mt-12 text-center">
            <a href="#contact" className="btn-brand text-sm">
              Start Your Journey<ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
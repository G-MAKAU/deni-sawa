import { useState } from 'react';
import { ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { Counter } from '@/components/Counter';
import { Reveal } from '@/components/Reveal';
import { business, heroImages } from '@/data/content';

export function Hero() {
  const [debtAmount, setDebtAmount] = useState(5000);
  const formattedAmount = debtAmount.toLocaleString('en-KE');

  return (
    <section id="home" className="relative overflow-hidden bg-[#eef8ff] dark:bg-[#102331]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_45%,rgba(255,255,255,0.92),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.7),transparent_60%)] dark:bg-[radial-gradient(circle_at_76%_45%,rgba(45,157,120,0.12),transparent_35%)]" />
      <div className="container-lux relative">
        <div className="grid min-h-[610px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.9fr)] lg:gap-8 lg:pb-0 xl:grid-cols-[1fr_0.95fr]">
          <div className="relative z-10 max-w-2xl">
            <Reveal>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white/75 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-brand shadow-sm dark:bg-white/10">
                <Sparkles className="h-3.5 w-3.5" /> Debt support that moves you forward
              </div>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="max-w-3xl font-heading text-5xl font-extrabold leading-[1.04] tracking-tight text-[#193d5b] sm:text-6xl lg:text-[4.3rem] dark:text-white">
                Debt free, <span className="text-brand">done right.</span>
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#47647a] sm:text-xl dark:text-white/70">
                Overwhelmed by debt? We help individuals, families, and businesses understand their options and take a practical step toward financial freedom.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="mt-9 max-w-[540px] rounded-3xl border border-white/80 bg-white/70 p-5 shadow-soft backdrop-blur-sm sm:p-6 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="debt-amount" className="font-heading text-xl font-bold text-[#193d5b] sm:text-2xl dark:text-white">
                    What is your total debt?
                  </label>
                  <output htmlFor="debt-amount" className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#193d5b] shadow-sm dark:bg-white/10 dark:text-white">
                    KSh {formattedAmount}
                  </output>
                </div>
                <input
                  id="debt-amount"
                  type="range"
                  min="5000"
                  max="2500000"
                  step="5000"
                  value={debtAmount}
                  onChange={(event) => setDebtAmount(Number(event.target.value))}
                  className="mt-5 h-2 w-full cursor-pointer accent-brand"
                  aria-label="Choose your total debt amount"
                />
                <div className="mt-2 flex justify-between text-xs font-medium text-[#668096] dark:text-white/50">
                  <span>KSh 5,000</span>
                  <span>KSh 2.5M+</span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="#contact" className="btn-brand">
                    Get a free consultation <ArrowRight className="h-4 w-4" />
                  </a>
                  <a href="#services" className="btn-ghost-light">Explore your options</a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={400}>
              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm font-medium text-[#47647a] dark:text-white/70">
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-green" /> Professional guidance</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-green" /> Ethical solutions</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-green" /> No judgement</span>
              </div>
            </Reveal>
          </div>

          <Reveal direction="scale" delay={200}>
            <div className="relative mx-auto flex h-[430px] w-full max-w-[520px] items-end justify-center sm:h-[540px] lg:h-[610px] lg:max-w-none">
              <div className="absolute bottom-0 left-1/2 h-[88%] w-[86%] -translate-x-1/2 rounded-t-[48%] bg-[#d9edf9] dark:bg-[#1b4053]" />
              <div className="absolute bottom-5 left-1/2 h-[76%] w-[78%] -translate-x-1/2 rounded-t-[48%] border border-white/70 dark:border-white/10" />
              <img
                src={heroImages.main}
                alt="Financial advisor helping a client plan a debt-free future"
                className="relative z-10 h-full w-full object-cover object-center [mask-image:linear-gradient(to_bottom,transparent_0%,black_9%,black_100%)] sm:w-[94%] lg:w-full"
                loading="eager"
              />
              <div className="absolute bottom-7 left-4 z-20 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-soft backdrop-blur-md sm:bottom-10 sm:left-0 sm:p-5 dark:border-white/10 dark:bg-[#102331]/90">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green text-white"><ShieldCheck className="h-5 w-5" /></div>
                  <div>
                    <p className="font-heading text-sm font-bold text-[#193d5b] dark:text-white">A trusted way forward</p>
                    <p className="text-xs text-[#668096] dark:text-white/60">{business.name} advisory team</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-8 right-2 z-20 hidden rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-soft backdrop-blur-md sm:block dark:border-white/10 dark:bg-[#102331]/90">
                <p className="font-heading text-2xl font-bold text-brand"><Counter target={20} suffix="+" /></p>
                <p className="text-xs text-[#668096] dark:text-white/60">years of experience</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

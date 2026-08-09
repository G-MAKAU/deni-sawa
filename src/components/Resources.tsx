'use client';

import { useState } from 'react';
import { ArrowRight, Clock, BookOpen, FileText, Download } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { articles, articleCategories } from '@/data/content';

export function Resources() {
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? articles : articles.filter((a) => a.category === filter);
  const featured = filtered.find((a) => a.featured) || filtered[0];
  const rest = filtered.filter((a) => a !== featured);

  return (
    <section id="resources" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="container-lux">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <Reveal><div className="eyebrow mb-5"><BookOpen className="h-3.5 w-3.5" />Financial Resources</div></Reveal>
            <Reveal delay={100}>
              <h2 className="section-heading mb-4">
                Guides, articles & <span className="text-brand-gradient">financial tips</span>
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Practical resources to support your journey toward financial freedom — from debt management guides to money mindset principles.
              </p>
            </Reveal>
          </div>
        </div>

        <Reveal>
          <div className="flex flex-wrap gap-2 mb-10">
            {articleCategories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)} className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${filter === cat ? 'bg-brand text-white shadow-brand-sm' : 'border border-border bg-card text-muted-foreground hover:border-brand/40 hover:text-brand'}`}>
                {cat}
              </button>
            ))}
          </div>
        </Reveal>

        {featured && (
          <Reveal direction="scale">
            <div className="group relative grid lg:grid-cols-2 gap-0 rounded-5xl overflow-hidden border border-border bg-card shadow-soft mb-8 hover:shadow-soft-lg transition-shadow duration-500">
              <div className="relative aspect-[16/10] lg:aspect-auto bg-gradient-to-br from-brand to-brand-700 overflow-hidden">
                <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
                  <FileText className="h-16 w-16 text-white/80 mb-4" strokeWidth={1.5} />
                  <span className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white">Featured Article</span>
                </div>
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_72%)]" />
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">{featured.category}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />{featured.readTime}</span>
                </div>
                <h3 className="font-heading text-2xl lg:text-3xl font-bold leading-tight mb-4 group-hover:text-brand transition-colors duration-300">{featured.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-6">{featured.excerpt}</p>
                <a href="#contact" className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition-all duration-300 hover:gap-3">Read Article<ArrowRight className="h-4 w-4" /></a>
              </div>
            </div>
          </Reveal>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {rest.map((article, i) => (
            <Reveal key={article.title} delay={(i % 3) * 100} direction="up">
              <article className="group h-full card-elevated cursor-pointer">
                <div className="flex items-center justify-between mb-5">
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">{article.category}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />{article.readTime}</span>
                </div>
                <div className={`mb-5 h-32 rounded-3xl bg-gradient-to-br flex items-center justify-center transition-all duration-500 ${i % 2 === 0 ? 'from-brand/5 to-brand/10 group-hover:from-brand/10 group-hover:to-brand/15' : 'from-green/5 to-green/10 group-hover:from-green/10 group-hover:to-green/15'}`}>
                  <BookOpen className={`h-10 w-40 transition-transform duration-500 group-hover:scale-110 ${i % 2 === 0 ? 'text-brand/40' : 'text-green/40'}`} strokeWidth={1.5} />
                </div>
                <h3 className={`font-heading text-lg font-bold leading-snug mb-3 transition-colors duration-300 ${i % 2 === 0 ? 'group-hover:text-brand' : 'group-hover:text-green'}`}>{article.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-3">{article.excerpt}</p>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs text-muted-foreground">{article.date}</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-all duration-300 group-hover:gap-2.5 ${i % 2 === 0 ? 'text-brand' : 'text-green'}`}>Read More<ArrowRight className="h-3.5 w-3.5" /></span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 rounded-4xl border border-green/20 bg-green/5 p-8">
            <Download className="h-8 w-8 text-green" />
            <div className="text-center sm:text-left">
              <h3 className="font-heading text-lg font-bold">Free Financial Resources</h3>
              <p className="text-sm text-muted-foreground">Download guides, templates, and tools to support your debt-free journey.</p>
            </div>
            <a href="#contact" className="btn-brand text-sm sm:ml-auto">Get Resources<ArrowRight className="h-4 w-4" /></a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

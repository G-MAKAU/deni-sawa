import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ClipboardCheck, Clock, Sparkles, ShieldCheck, SquareCheckBig } from 'lucide-react';
import { site } from '@/data/site';
import { getServiceClient } from '@/lib/supabase/service';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

async function getCheckIntro(slug: string) {
  try {
    const supabase = getServiceClient();
    const { data: check, error } = await supabase
      .from('health_checks')
      .select('id, name, description, image_url, estimated_minutes, tags, is_active')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();
    if (error) return null;
    if (!check) return null;

    const { data: sections } = await supabase.from('health_check_sections').select('id').eq('health_check_id', check.id);
    const sectionIds = (sections ?? []).map((s) => s.id);
    const { data: subsections } = await supabase.from('health_check_subsections').select('id').in('section_id', sectionIds);
    const subsectionIds = (subsections ?? []).map((s) => s.id);
    const { count } = await supabase
      .from('health_check_questions')
      .select('id', { count: 'exact', head: true })
      .in('subsection_id', subsectionIds);

    return {
      name: check.name as string,
      description: (check.description as string | null) ?? '',
      image_url: (check.image_url as string | null) ?? null,
      estimated_minutes: (check.estimated_minutes as number | null) ?? 15,
      tags: (check.tags as string[]) ?? [],
      question_count: count ?? 0,
      section_count: (sections ?? []).length,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const intro = await getCheckIntro(slug);
  if (!intro) return {};
  return {
    title: `${intro.name} | AI-Powered Assessment | Deni Sawa`,
    description: intro.description || `An AI-powered assessment by Deni Sawa Partners.`,
    alternates: { canonical: `${site.url}/health-checks/${slug}` },
  };
}

export default async function CheckIntroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const intro = await getCheckIntro(slug);
  if (!intro) notFound();

  return (
    <>
      <PageHero
        eyebrow="Health Check"
        title={intro.name}
        subtitle={intro.description}
        crumbs={[{ label: 'Health Checks', href: '/health-checks' }, { label: intro.name }]}
        image={{
          src: intro.image_url ?? (slug.startsWith('business') ? '/images/business-check.jpg' : '/images/professional-check.jpg'),
          alt: intro.name,
        }}
      >
        <Button asChild size="lg">
          <Link href={`/health-checks/assessment/${slug}`}>
            Start the Assessment
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </PageHero>

      <section className="section-pad bg-background">
        <div className="container-lux grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading align="left" eyebrow="What is covered" title="Assessment areas" />
            <ul className="grid gap-3 sm:grid-cols-2">
              {intro.tags.length > 0 ? (
                intro.tags.map((area) => (
                  <li key={area} className="card-elevated flex items-start gap-3 p-5 text-[15px] font-medium text-foreground">
                    <SquareCheckBig className="mt-0.5 h-5 w-5 flex-shrink-0 text-growth" strokeWidth={1.8} />
                    {area}
                  </li>
                ))
              ) : (
                <li className="card-elevated flex items-start gap-3 p-5 text-[15px] font-medium text-foreground">
                  <SquareCheckBig className="mt-0.5 h-5 w-5 flex-shrink-0 text-growth" strokeWidth={1.8} />
                  A structured, AI-powered diagnostic assessment.
                </li>
              )}
            </ul>
          </div>

          <aside>
            <SectionHeading align="left" eyebrow="Before you start" title="What to expect" />
            <div className="space-y-4">
              {[
                { icon: ClipboardCheck, title: `${intro.question_count} questions in ${intro.section_count} sections`, text: 'Answered section by section, with a progress bar — you can pause and resume.' },
                { icon: Clock, title: `${intro.estimated_minutes} minutes`, text: 'Answer honestly — the diagnosis is only as good as the inputs.' },
                { icon: Sparkles, title: 'AI-generated report', text: 'Claude AI structures your findings into a readable diagnostic report.' },
                { icon: ShieldCheck, title: 'Confidential and private', text: 'Your responses and report are never shared. Reports are private and unique to you.' },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 80}>
                  <div className="flex items-start gap-4 rounded-lg border border-card-border bg-card p-5">
                    <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <item.icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <CTASection
        title="Ready when you are"
        subtitle={`The assessment takes about ${intro.estimated_minutes} minutes. You'll have your diagnostic report within minutes of finishing.`}
        primary={{ label: 'Start the Assessment', href: `/health-checks/assessment/${slug}` }}
      />
    </>
  );
}

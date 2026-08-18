import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Lock } from 'lucide-react';
import { site } from '@/data/site';
import { getServiceClient } from '@/lib/supabase/service';
import { HealthCheckWizardV2 } from '@/features/health-check/HealthCheckWizardV2';

async function getCheckIntro(slug: string) {
  try {
    const supabase = getServiceClient();
    const { data: check, error } = await supabase
      .from('health_checks')
      .select('id, name, description, estimated_minutes, is_active')
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
      estimated_minutes: (check.estimated_minutes as number | null) ?? 15,
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
    title: `${intro.name} | Deni Sawa`,
    description: `Take the ${intro.name} — a structured, confidential assessment. Your responses are analysed and a structured report is prepared, which our advisors use as the foundation for your first conversation.`,
    alternates: { canonical: `${site.url}/health-checks/${slug}` },
  };
}

export default async function CheckPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const intro = await getCheckIntro(slug);
  if (!intro) notFound();

  return (
    <main className="bg-background">
      {/* Slim info bar — the only place the check description and back link live */}
      <div className="border-b border-card-border bg-background">
        <div className="container-lux flex h-14 items-center justify-between gap-3">
          <Link
            href="/health-checks"
            className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Health Checks
          </Link>
          <span className="min-w-0 truncate text-[14px] font-bold text-foreground">{intro.name}</span>
          <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-brand" /> ~{intro.estimated_minutes} min · {intro.section_count} sections
            <Lock className="ml-1 h-3.5 w-3.5 text-growth" /> Confidential
          </span>
        </div>
      </div>

      {/* Wizard — step 1 (your details) then straight to Question 1 */}
      <div className="container-lux py-8 sm:py-12">
        <HealthCheckWizardV2 slug={slug} />
      </div>
    </main>
  );
}
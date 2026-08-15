import type { Metadata } from 'next';
import { site } from '@/data/site';
import { HealthCheckWizardV2 } from '@/features/health-check/HealthCheckWizardV2';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: 'Health Check Assessment | Deni Sawa',
    description: 'Take the assessment — a structured, confidential flow that powers your AI diagnostic report.',
    alternates: { canonical: `${site.url}/health-checks/assessment/${slug}` },
    robots: { index: false, follow: false },
  };
}

export default async function AssessmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <main className="section-pad bg-background">
      <div className="container-lux">
        <HealthCheckWizardV2 slug={slug} />
      </div>
    </main>
  );
}

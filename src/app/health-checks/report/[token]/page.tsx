import type { Metadata } from 'next';
import { ReportViewerV2 } from '@/features/health-check/ReportViewerV2';

export const metadata: Metadata = {
  title: 'Health Check Report | Deni Sawa',
  description: 'Your private, AI-generated diagnostic report.',
  robots: { index: false, follow: false },
};

export default async function ReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <main className="section-pad bg-background">
      <div className="container-lux">
        <ReportViewerV2 token={token} />
      </div>
    </main>
  );
}

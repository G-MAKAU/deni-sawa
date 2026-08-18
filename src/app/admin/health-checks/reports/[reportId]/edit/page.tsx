import type { Metadata } from 'next';
import { ReportEditor } from '@/components/admin/health-checks/ReportEditor';

export const metadata: Metadata = {
  title: 'Edit Report | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default async function ReportEditPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <ReportEditor reportId={reportId} />;
}

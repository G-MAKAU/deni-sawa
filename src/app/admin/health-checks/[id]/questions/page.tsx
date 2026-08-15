import type { Metadata } from 'next';
import { Suspense } from 'react';
import { QuestionsManager } from '@/components/admin/health-checks/QuestionsManager';
import { Loading } from '@/components/admin/ui';

export const metadata: Metadata = {
  title: 'Questions | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function QuestionsPage() {
  return (
    <Suspense fallback={<Loading label="Loading question tree…" />}>
      <QuestionsManager />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordClient } from '@/components/admin/ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Reset Password | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}

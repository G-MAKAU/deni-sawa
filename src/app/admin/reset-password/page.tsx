import type { Metadata } from 'next';
import { ResetPasswordClient } from '@/components/admin/ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Reset Password | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}

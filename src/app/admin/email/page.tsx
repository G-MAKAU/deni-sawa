import type { Metadata } from 'next';
import { EmailTemplatesListClient } from '@/components/admin/email/EmailTemplatesListClient';

export const metadata: Metadata = {
  title: 'Email Templates | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function EmailTemplatesPage() {
  return <EmailTemplatesListClient />;
}

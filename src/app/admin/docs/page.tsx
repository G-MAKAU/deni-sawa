import type { Metadata } from 'next';
import { DocsClient } from '@/components/admin/docs/DocsClient';

export const metadata: Metadata = {
  title: 'Documentation | Admin',
  robots: { index: false, follow: false },
};

export default function DocsPage() {
  return <DocsClient />;
}
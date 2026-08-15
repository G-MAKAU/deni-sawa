import type { Metadata } from 'next';
import { EmailTemplateEditor } from '@/components/admin/email/EmailTemplateEditor';

export const metadata: Metadata = {
  title: 'Edit Email Template | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function EmailTemplateEditorPage() {
  return <EmailTemplateEditor />;
}

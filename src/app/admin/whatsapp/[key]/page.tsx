import type { Metadata } from 'next';
import { WhatsAppTemplateEditor } from '@/components/admin/whatsapp/WhatsAppTemplateEditor';

export const metadata: Metadata = {
  title: 'Edit WhatsApp Template | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function WhatsAppTemplateEditorPage() {
  return <WhatsAppTemplateEditor />;
}

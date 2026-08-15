import type { Metadata } from 'next';
import { WhatsAppTemplatesListClient } from '@/components/admin/whatsapp/WhatsAppTemplatesListClient';

export const metadata: Metadata = {
  title: 'WhatsApp Templates | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function WhatsAppTemplatesPage() {
  return <WhatsAppTemplatesListClient />;
}

import type { Metadata } from 'next';
import { WhatsAppConfigClient } from '@/components/admin/whatsapp/WhatsAppConfigClient';

export const metadata: Metadata = {
  title: 'WhatsApp Config | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function WhatsAppConfigPage() {
  return <WhatsAppConfigClient />;
}

import type { Metadata } from 'next';
import { LogViewer } from '@/components/admin/logs/LogViewer';

export const metadata: Metadata = {
  title: 'WhatsApp Log | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function WhatsAppLogPage() {
  return (
    <LogViewer
      title="WhatsApp Log"
      subtitle="Every outbound WhatsApp message attempt."
      endpoint="/api/admin/whatsapp-log"
      statuses={['pending', 'sent', 'delivered', 'failed', 'read']}
      columns={[
        { key: 'to_number', label: 'To' },
        { key: 'body_sent', label: 'Body' },
        { key: 'provider', label: 'Provider' },
      ]}
    />
  );
}

import type { Metadata } from 'next';
import { LogViewer } from '@/components/admin/logs/LogViewer';

export const metadata: Metadata = {
  title: 'Email Log | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function EmailLogPage() {
  return (
    <LogViewer
      title="Email Log"
      subtitle="Every outbound email attempt for audit and retry."
      endpoint="/api/admin/email-log"
      statuses={['pending', 'sent', 'failed', 'bounced']}
      columns={[
        { key: 'to_email', label: 'To' },
        { key: 'subject', label: 'Subject' },
        { key: 'template_key', label: 'Template' },
      ]}
    />
  );
}

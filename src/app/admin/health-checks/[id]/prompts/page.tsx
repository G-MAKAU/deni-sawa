import type { Metadata } from 'next';
import { PromptEditor } from '@/components/admin/health-checks/PromptEditor';

export const metadata: Metadata = {
  title: 'Report Prompts | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function PromptsPage() {
  return <PromptEditor />;
}

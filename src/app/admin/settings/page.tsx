import type { Metadata } from 'next';
import { SettingsClient } from '@/components/admin/settings/SettingsClient';

export const metadata: Metadata = {
  title: 'Settings | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return <SettingsClient />;
}

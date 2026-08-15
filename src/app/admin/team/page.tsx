import type { Metadata } from 'next';
import { TeamClient } from '@/components/admin/team/TeamClient';

export const metadata: Metadata = {
  title: 'Team | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function TeamPage() {
  return <TeamClient />;
}

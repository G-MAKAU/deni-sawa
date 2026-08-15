import type { Metadata } from 'next';
import { StorageManager } from '@/components/admin/storage/StorageManager';

export const metadata: Metadata = {
  title: 'Storage | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function StoragePage() {
  return <StorageManager />;
}

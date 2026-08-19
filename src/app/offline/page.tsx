import type { Metadata } from 'next';
import { OfflinePageContent } from './OfflinePageContent';

export const metadata: Metadata = {
  title: 'Offline',
  description: 'You are currently offline. Please check your connection and try again.',
};

export default function OfflinePage() {
  return <OfflinePageContent />;
}
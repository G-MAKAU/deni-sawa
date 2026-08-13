import type { Metadata } from 'next';
import { BlogCMSClient } from '@/components/admin/BlogCMSClient';

export const metadata: Metadata = {
  title: 'Blog Dashboard | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function AdminBlogPage() {
  return <BlogCMSClient />;
}
import type { Metadata } from 'next';
import { CommentsModerationClient } from '@/components/admin/comments/CommentsModerationClient';

export const metadata: Metadata = {
  title: 'Blog Comments | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function AdminBlogCommentsPage() {
  return <CommentsModerationClient />;
}

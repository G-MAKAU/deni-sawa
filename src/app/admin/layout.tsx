import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { ConfirmProvider } from '@/components/admin/confirm';

export const metadata: Metadata = {
  title: 'Admin | Deni Sawa Partners',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      <ConfirmProvider>{children}</ConfirmProvider>
    </AdminShell>
  );
}

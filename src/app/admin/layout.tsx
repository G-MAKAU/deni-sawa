import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin | Deni Sawa',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-25 dark:bg-ink-950">
      <header className="border-b border-border bg-card">
        <div className="container-lux flex h-16 items-center justify-between">
          <Link href="/admin/blog" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-extrabold text-white">
              D
            </span>
            <span className="text-sm font-bold">
              Deni Sawa <span className="text-muted-foreground font-semibold">Admin</span>
            </span>
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-brand"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View site
          </a>
        </div>
      </header>
      <main className="container-lux py-6 lg:py-8">{children}</main>
    </div>
  );
}
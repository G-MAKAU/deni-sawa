'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Moon, Sun, Settings } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/browser';
import { getAdminToken, adminFetch } from '@/lib/admin-client';
import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';
import { AccountModal } from '@/components/admin/AccountModal';

type RoleTone = 'orange' | 'green' | 'blue' | 'grey';

const ROLE_TONES: Record<string, RoleTone> = {
  super_admin: 'orange',
  admin: 'green',
  manager: 'blue',
  support: 'grey',
};

const ROLE_STYLES: Record<RoleTone, string> = {
  orange: 'bg-[#E8510A] text-white',
  green: 'bg-[#5A9E28] text-white',
  blue: 'bg-blue-500 text-white',
  grey: 'bg-[#6B7280] text-white',
};

interface AdminIdentity {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface NavItem {
  label: string;
  href: string;
  exact?: boolean;
  icon?: React.ReactNode;
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/admin/dashboard', icon: <IconGrid /> }],
  },
  {
    label: 'Health Checks',
    items: [
      { label: 'All Health Checks', href: '/admin/health-checks', icon: <IconActivity /> },
      { label: 'Sessions', href: '/admin/health-checks/sessions', icon: <IconUsers /> },
      { label: 'Reports', href: '/admin/health-checks/reports', icon: <IconFile /> },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Email Templates', href: '/admin/email', icon: <IconMail /> },
      { label: 'Email Log', href: '/admin/email-log', icon: <IconSend /> },
      { label: 'WhatsApp Templates', href: '/admin/whatsapp', icon: <IconMessage /> },
      { label: 'WhatsApp Config', href: '/admin/whatsapp/config', icon: <IconSettings /> },
      { label: 'WhatsApp Log', href: '/admin/whatsapp-log', icon: <IconMessageSquare /> },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Blog', href: '/admin/blog', icon: <IconPen /> },
      { label: 'Comments', href: '/admin/blog/comments', icon: <IconMessageSquare /> },
      { label: 'Academy', href: '/admin/academy', icon: <IconGraduation /> },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Team', href: '/admin/team', icon: <IconShield /> },
      { label: 'Storage', href: '/admin/storage', icon: <IconStorage /> },
      { label: 'Settings', href: '/admin/settings', icon: <IconSliders /> },
      { label: 'Documentation', href: '/admin/docs', icon: <IconBook /> },
    ],
  },
];

const TITLES: { prefix: string; title: string }[] = [
  { prefix: '/admin/dashboard', title: 'Dashboard' },
  { prefix: '/admin/health-checks/sessions', title: 'Health Check Sessions' },
  { prefix: '/admin/health-checks/reports', title: 'Health Check Reports' },
  { prefix: '/admin/health-checks', title: 'Health Checks' },
  { prefix: '/admin/email-log', title: 'Email Log' },
  { prefix: '/admin/email', title: 'Email Templates' },
  { prefix: '/admin/whatsapp-log', title: 'WhatsApp Log' },
  { prefix: '/admin/whatsapp/config', title: 'WhatsApp Configuration' },
  { prefix: '/admin/whatsapp', title: 'WhatsApp Templates' },
  { prefix: '/admin/blog/comments', title: 'Blog Comments' },
  { prefix: '/admin/blog', title: 'Blog' },
  { prefix: '/admin/academy', title: 'Academy' },
  { prefix: '/admin/team', title: 'Team' },
  { prefix: '/admin/storage', title: 'Storage' },
  { prefix: '/admin/settings', title: 'Settings' },
  { prefix: '/admin/docs', title: 'Documentation' },
];

function pageTitle(pathname: string): string {
  for (const entry of TITLES) {
    if (pathname.startsWith(entry.prefix)) return entry.title;
  }
  return 'Admin';
}

function Logo() {
  return (
    <Link href="/admin/dashboard" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8510A] font-heading text-sm font-bold text-white">
        DS
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold tracking-tight text-white">
          DENI <span className="text-[#E8510A]">SAWA</span>
        </span>
        <span className="block text-[9px] font-medium uppercase tracking-[0.28em] text-[var(--a-muted)]">Admin Console</span>
      </span>
    </Link>
  );
}

function NavLinks({ pathname, onNavigate, badges }: { pathname: string; onNavigate?: () => void; badges?: Record<string, number> }) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5C5751]">{section.label}</p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const badge = badges?.[item.href] ?? 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                      active ? 'text-[#E8510A]' : 'text-[#B8B2AB] hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-[#E8510A]" />}
                    <span className={cn('transition-colors', active ? 'text-[#E8510A]' : 'text-[var(--a-muted)] group-hover:text-white')}>{item.icon}</span>
                    {item.label}
                    {badge > 0 && (
                      <span className="ml-auto rounded-full bg-[#E8510A] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = React.useState<AdminIdentity | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [dark, setDark] = React.useState(false);
  const [pendingComments, setPendingComments] = React.useState(0);

  // Show an unmoderated-comment badge on the nav item.
  React.useEffect(() => {
    if (pathname === '/admin/login') return;
    let cancelled = false;
    (async () => {
      try {
        const data = await adminFetch<{ counts: { pending: number } }>('/api/admin/blog/comments?status=pending&limit=1');
        if (!cancelled) setPendingComments(data.counts.pending);
      } catch {
        // non-fatal — badge just stays hidden
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Sync the toggle with the site-wide theme applied by ThemeProvider.
  React.useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = document.documentElement.getAttribute('data-theme') !== 'dark';
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('denisawa-theme', next ? 'dark' : 'light');
    } catch {
      /* noop */
    }
    setDark(next);
  };

  React.useEffect(() => {
    if (pathname === '/admin/login') return;
    let cancelled = false;
    (async () => {
      const token = await getAdminToken();
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      try {
        const me = await adminFetch<{ admin: AdminIdentity }>('/api/admin/me');
        if (!cancelled) setAdmin(me.admin);
      } catch {
        const supabase = createBrowserClient();
        await supabase.auth.signOut();
        if (!cancelled) router.replace('/admin/login');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
    } finally {
      router.replace('/admin/login');
    }
  };

  const title = pageTitle(pathname);

  // Login is rendered outside the shell chrome.
  if (pathname === '/admin/login') {
    return (
      <>
        <Toaster position="top-right" richColors closeButton theme={dark ? 'dark' : 'light'} />
        {children}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--a-bg)]">
      <Toaster position="top-right" richColors closeButton />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-[#111111] lg:flex">
        <div className="flex h-16 items-center border-b border-white/5 px-5">
          <Logo />
        </div>
        <NavLinks pathname={pathname} badges={{ '/admin/blog/comments': pendingComments }} />
        <div className="border-t border-white/5 px-5 py-4 text-[10px] uppercase tracking-widest text-[#5C5751]">
          Deni Sawa Partners
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#111111]/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-[#111111] shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-white/5 px-5">
              <Logo />
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="text-[var(--a-muted)] hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <NavLinks pathname={pathname} badges={{ '/admin/blog/comments': pendingComments }} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[var(--a-border)] bg-[var(--a-bg)] px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] text-[var(--a-ink2)] lg:hidden"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="font-heading text-lg font-bold tracking-tight text-[var(--a-ink)]">{title}</h1>
              <p className="hidden text-[11px] text-[var(--a-muted)] sm:block">{pathname}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] text-[var(--a-text)] transition-colors hover:border-[#E8510A]/40 hover:text-[#E8510A]"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {admin ? (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setAccountOpen(true)}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1 text-left transition-colors hover:bg-[var(--a-subtle)]"
                  title="Account settings"
                >
                  <div className="hidden text-right sm:block">
                    <p className="text-[13px] font-semibold leading-tight text-[var(--a-ink2)]">{admin.full_name}</p>
                    <p className="text-[11px] text-[var(--a-muted)]">{admin.email}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                      ROLE_STYLES[ROLE_TONES[admin.role] ?? 'grey']
                    )}
                  >
                    {admin.role.replace('_', ' ')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountOpen(true)}
                  aria-label="Account settings"
                  title="My account"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] text-[var(--a-text)] transition-colors hover:border-[#E8510A]/40 hover:text-[#E8510A]"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={signingOut}
                  title="Logout"
                  className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-2 text-[12px] font-semibold text-[var(--a-text)] transition-colors hover:border-[#E8510A]/40 hover:text-[#E8510A] disabled:opacity-50 md:px-3"
                >
                  {signingOut ? '…' : <IconLogout className="h-3.5 w-3.5" />}
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="h-9 w-28 animate-pulse rounded-lg bg-[var(--a-border)]" />
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <AccountModal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        admin={admin}
        onNameUpdated={(fullName) => setAdmin((prev) => (prev ? { ...prev, full_name: fullName } : prev))}
      />
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────────── */

function IconGrid() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}
function IconActivity() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l2.5-2.5a1.5 1.5 0 012.12 0l1.88 1.88 4.75-4.75m-11 5.5l4.5 4.5m0 0l2.25-2.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}
function IconMessage() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  );
}
function IconMessageSquare() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}
function IconPen() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}
function IconGraduation() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}
function IconStorage() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
}
function IconSliders() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}
function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

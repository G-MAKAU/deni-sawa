'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Activity, FileText, GraduationCap, PenLine, Users } from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import { AdminCard, EmptyState, Loading, PageHeader, StatusPill, Td, Th, ErrorBanner } from '@/components/admin/ui';

interface DashboardData {
  stats: {
    sessionsThisMonth: number;
    totalReports: number;
    publishedPosts: number;
    activeCourses: number;
  };
  recentSessions: {
    id: string;
    full_name: string;
    business_name: string | null;
    email: string | null;
    whatsapp: string | null;
    is_complete: boolean;
    started_at: string;
    check_name: string;
    report_count: number;
  }[];
  recentPosts: { id: string; title: string; status: string; updated_at: string }[];
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${accent}`}>{icon}</div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--a-muted)]">{label}</p>
        <p className="mt-0.5 font-heading text-2xl font-bold text-[var(--a-ink)]">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

export function DashboardClient() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await adminFetch<DashboardData>('/api/admin/dashboard');
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <Loading label="Loading dashboard…" />;

  const statCards = [
    { label: 'Sessions this month', value: data.stats.sessionsThisMonth, icon: <Users className="h-5 w-5 text-white" />, accent: 'bg-[#E8510A]' },
    { label: 'Reports generated', value: data.stats.totalReports, icon: <FileText className="h-5 w-5 text-white" />, accent: 'bg-[#5A9E28]' },
    { label: 'Posts published', value: data.stats.publishedPosts, icon: <PenLine className="h-5 w-5 text-white" />, accent: 'bg-blue-500' },
    { label: 'Active courses', value: data.stats.activeCourses, icon: <GraduationCap className="h-5 w-5 text-white" />, accent: 'bg-[#6B7280]' },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="A live overview of health check activity and published content." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <AdminCard
          title="Recent sessions"
          subtitle="The 10 most recent health check sessions"
          actions={
            <Link href="/admin/health-checks/sessions" className="text-xs font-semibold text-[#E8510A] hover:underline">
              View all →
            </Link>
          }
          bodyClassName="p-0"
        >
          {data.recentSessions.length === 0 ? (
            <EmptyState title="No sessions yet" description="Sessions appear here once visitors start a health check." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[var(--a-border-soft)] bg-[var(--a-subtle)]">
                  <tr>
                    <Th>Name</Th>
                    <Th>Check</Th>
                    <Th>Started</Th>
                    <Th>Reports</Th>
                    <Th align="center">Status</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--a-border-soft)]">
                  {data.recentSessions.map((session) => (
                    <tr key={session.id} className="transition-colors hover:bg-[var(--a-subtle)]">
                      <Td className="font-medium">{session.full_name}</Td>
                      <Td className="text-[var(--a-text2)]">{session.check_name}</Td>
                      <Td className="text-[var(--a-text2)]">{format(new Date(session.started_at), 'dd MMM, HH:mm')}</Td>
                      <Td align="center">{session.report_count}</Td>
                      <Td align="center">
                        <StatusPill tone={session.is_complete ? 'green' : 'amber'}>{session.is_complete ? 'Complete' : 'In progress'}</StatusPill>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <AdminCard
          title="Recent posts"
          subtitle="Latest content updates"
          actions={
            <Link href="/admin/blog" className="text-xs font-semibold text-[#E8510A] hover:underline">
              Manage blog →
            </Link>
          }
          bodyClassName="p-0"
        >
          {data.recentPosts.length === 0 ? (
            <EmptyState title="No posts yet" description="Published and draft posts appear here." />
          ) : (
            <div className="divide-y divide-[var(--a-border-soft)]">
              {data.recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <Link href="/admin/blog" className="block truncate text-sm font-medium text-[var(--a-ink2)] hover:text-[#E8510A]">
                      {post.title}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-[var(--a-muted)]">
                      <Activity className="h-3 w-3" />
                      Updated {format(new Date(post.updated_at), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <StatusPill tone={post.status === 'published' ? 'green' : post.status === 'draft' ? 'grey' : 'amber'}>
                    {post.status}
                  </StatusPill>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>
    </>
  );
}

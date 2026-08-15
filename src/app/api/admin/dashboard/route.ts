import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

interface RecentSession {
  id: string;
  full_name: string;
  business_name: string | null;
  email: string | null;
  whatsapp: string | null;
  is_complete: boolean;
  started_at: string;
  check_name: string;
  report_count: number;
}

interface RecentPost {
  id: string;
  title: string;
  status: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request, 'read');

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthStartIso = monthStart.toISOString();

    const [sessionsThisMonth, totalReports, publishedPosts, activeCourses] = await Promise.all([
      supabase.from('health_check_sessions').select('id', { count: 'exact', head: true }).gte('started_at', monthStartIso),
      supabase.from('health_check_reports').select('id', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('lms_courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    const recentSessionsResult = await supabase
      .from('health_check_sessions')
      .select('id, full_name, business_name, email, whatsapp, is_complete, started_at, health_checks(name)')
      .order('started_at', { ascending: false })
      .limit(10);

    const recentSessions: RecentSession[] = (recentSessionsResult.data ?? []).map((row) => {
      const check = Array.isArray(row.health_checks) ? row.health_checks[0] : row.health_checks;
      return {
        id: row.id,
        full_name: row.full_name,
        business_name: row.business_name,
        email: row.email,
        whatsapp: row.whatsapp,
        is_complete: row.is_complete,
        started_at: row.started_at,
        check_name: check?.name ?? '—',
        report_count: 0,
      };
    });

    // Enrich with report counts for the recent sessions.
    if (recentSessions.length > 0) {
      const sessionIds = recentSessions.map((s) => s.id);
      const { data: reports } = await supabase
        .from('health_check_reports')
        .select('session_id')
        .in('session_id', sessionIds);
      const counts = new Map<string, number>();
      (reports ?? []).forEach((r) => counts.set(r.session_id, (counts.get(r.session_id) ?? 0) + 1));
      recentSessions.forEach((s) => (s.report_count = counts.get(s.id) ?? 0));
    }

    const recentPostsResult = await supabase
      .from('blog_posts')
      .select('id, title, status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      stats: {
        sessionsThisMonth: sessionsThisMonth.count ?? 0,
        totalReports: totalReports.count ?? 0,
        publishedPosts: publishedPosts.count ?? 0,
        activeCourses: activeCourses.count ?? 0,
      },
      recentSessions,
      recentPosts: (recentPostsResult.data ?? []) as RecentPost[],
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load dashboard');
  }
}

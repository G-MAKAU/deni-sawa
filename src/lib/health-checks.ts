import { getServiceClient } from '@/lib/supabase/service';

export interface HealthCheckCardData {
  id: string;
  slug: string;
  title: string;
  description: string;
  estimated_minutes: number;
  tags: string[];
  image_url: string | null;
}

/**
 * All active health checks, ordered by sort_order. Used wherever the
 * assessment cards are shown so the site reflects whatever checks the
 * system actually has — not a hardcoded count.
 */
export async function getActiveHealthChecks(): Promise<HealthCheckCardData[]> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('health_checks')
      .select('id, name, slug, description, estimated_minutes, tags, image_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) return [];
    return (data ?? []).map((c) => ({
      id: c.id as string,
      slug: c.slug as string,
      title: c.name as string,
      description: (c.description as string | null) ?? '',
      estimated_minutes: (c.estimated_minutes as number | null) ?? 15,
      tags: (c.tags as string[]) ?? [],
      image_url: (c.image_url as string | null) ?? null,
    }));
  } catch {
    return [];
  }
}
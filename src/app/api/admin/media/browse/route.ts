import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getServiceClient } from '@/lib/supabase/service';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { bucket } = body as { bucket?: string };
    await requireAdmin(request, 'read');
    const supabaseClient = getServiceClient();

    // Get all buckets
    const { data: buckets, error: bucketsError } = await supabaseClient.storage.listBuckets();
    if (bucketsError) {
      console.error('Buckets list error:', bucketsError);
      return NextResponse.json({ error: 'Failed to list buckets' }, { status: 500 });
    }

    const bucketsToSearch = bucket ? buckets.filter(b => b.name === bucket) : buckets;

    const bucketImages = await Promise.all(
      bucketsToSearch.map(async (b) => {
        const { data: files, error } = await supabaseClient.storage
          .from(b.name)
          .list('', { limit: 200, offset: 0, sortBy: { column: 'created_at', order: 'desc' } });
        if (error) {
          console.error(`Storage list error for bucket ${b.name}:`, error);
          return [];
        }
        return (files ?? [])
          .filter((f) => f.metadata?.mimetype?.startsWith('image/'))
          .map((f) => {
            const { data: urlData } = supabaseClient.storage.from(b.name).getPublicUrl(f.name);
            return { bucket: b.name, name: f.name, url: urlData.publicUrl, size: f.metadata?.size ?? 0, createdAt: f.created_at ?? new Date().toISOString() };
          });
      })
    );

    const allImages = bucketImages.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (allImages.length === 0) {
      return NextResponse.json({ error: 'No images found', images: [] });
    }

    return NextResponse.json({ images: allImages });
  } catch (error) {
    console.error('Media browse error:', error);
    return NextResponse.json({ error: 'Failed to browse media', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getServiceClient } from '@/lib/supabase/service';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request, 'update');
    const supabaseClient = getServiceClient();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    // Get available buckets
    const { data: bucketsData } = await supabaseClient.storage.listBuckets();
    const buckets = bucketsData ?? [];
    const targetBucket = bucket && buckets.find(b => b.name === bucket) ? bucket : buckets[0]?.name || 'deni_sawa';

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `email-templates/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseClient.storage
      .from(targetBucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image', details: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseClient.storage.from(targetBucket).getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl, bucket: targetBucket });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
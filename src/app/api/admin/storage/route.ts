import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const BUCKET = 'deni_sawa';
// Total storage quota for the progress indicator (Supabase plan quota, MB).
const STORAGE_QUOTA = Number(process.env.SUPABASE_STORAGE_QUOTA_MB ?? 1024) * 1024 * 1024;
// Per-file ceiling for direct uploads (Supabase's single-request upload limit).
const MAX_FILE_SIZE = Number(process.env.SUPABASE_STORAGE_MAX_FILE_MB ?? 50) * 1024 * 1024;

const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf'];

interface StorageFile {
  name: string;
  id: string;
  size: number;
  contentType: string;
  updatedAt: string | null;
  publicUrl: string;
  /** True when the file's path/URL is referenced anywhere in the system. */
  used: boolean;
}

interface StorageFolder {
  name: string;
}

function sanitizeName(name: string): string {
  const safe = name
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-{2,}/g, '-')
    .trim();
  return safe || `file-${Date.now()}`;
}

// The authenticated (user-scoped) client is used so storage works without the
// service-role key — RLS grants signed-in admins full access to the bucket.
async function listDir(supabase: SupabaseClient, folder: string): Promise<{ folders: StorageFolder[]; files: StorageFile[] }> {
  const { data, error } = await supabase.storage.from(BUCKET).list(folder || '', {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) throw error;

  const folders: StorageFolder[] = [];
  const files: StorageFile[] = [];

  for (const entry of data ?? []) {
    if (entry.id === null) {
      folders.push({ name: entry.name });
      continue;
    }
    const path = folder ? `${folder}/${entry.name}` : entry.name;
    const metadata = entry.metadata as { size?: number; mimetype?: string } | null;
    files.push({
      name: entry.name,
      id: entry.id,
      size: metadata?.size ?? 0,
      contentType: metadata?.mimetype ?? 'application/octet-stream',
      updatedAt: entry.updated_at ?? null,
      publicUrl: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
      used: false,
    });
  }

  return { folders, files };
}

/** Bounded recursive walk to compute bucket usage. */
async function summarizeBucket(supabase: SupabaseClient): Promise<{ totalSize: number; totalFiles: number }> {
  const queue: string[] = [''];
  const seen = new Set<string>();
  let totalSize = 0;
  let totalFiles = 0;

  while (queue.length > 0) {
    const folder = queue.pop() as string;
    const key = folder || '';
    if (seen.has(key)) continue;
    seen.add(key);

    const { data, error } = await supabase.storage.from(BUCKET).list(key, { limit: 1000 });
    if (error) continue;

    for (const entry of data ?? []) {
      if (entry.id === null) {
        queue.push(folder ? `${folder}/${entry.name}` : entry.name);
      } else {
        totalFiles += 1;
        totalSize += (entry.metadata as { size?: number } | null)?.size ?? 0;
      }
    }
  }

  return { totalSize, totalFiles };
}

async function removePath(supabase: SupabaseClient, path: string): Promise<{ kind: 'file' | 'folder' }> {
  const { data: children, error } = await supabase.storage.from(BUCKET).list(path, { limit: 1000 });

  if (!error && children && children.length > 0) {
    for (const child of children) {
      if (child.id === null) {
        await removePath(supabase, `${path}/${child.name}`);
      } else {
        await supabase.storage.from(BUCKET).remove([`${path}/${child.name}`]);
      }
    }
    return { kind: 'folder' };
  }

  await supabase.storage.from(BUCKET).remove([path]);
  return { kind: 'file' };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request, 'read');

    const folder = (request.nextUrl.searchParams.get('folder') ?? '').replace(/^\/+|\/+$/g, '');

    const [listing, summary, posts] = await Promise.all([
      listDir(supabase, folder),
      summarizeBucket(supabase),
      supabase.from('blog_posts').select('cover_image_url, content_html, content_markdown'),
    ]);

    // Files referenced by any blog post (featured image or embedded content) are
    // flagged as "in use". The unique storage path or its public URL is matched.
    const haystack = ((posts.data ?? []) as Array<{ cover_image_url: string | null; content_html: string | null; content_markdown: string | null }>)
      .flatMap((p) => [p.cover_image_url, p.content_html, p.content_markdown])
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const files = listing.files.map((file) => {
      const path = folder ? `${folder}/${file.name}` : file.name;
      const used = path !== '' && (haystack.includes(path.toLowerCase()) || haystack.includes(file.publicUrl.toLowerCase()));
      return { ...file, used };
    });

    return NextResponse.json({
      folder,
      folders: listing.folders,
      files,
      summary: {
        totalSize: summary.totalSize,
        totalFiles: summary.totalFiles,
        usedFiles: files.filter((f) => f.used).length,
        quota: STORAGE_QUOTA,
        maxFileSize: MAX_FILE_SIZE,
        usedPercent: STORAGE_QUOTA > 0 ? Math.min(100, Math.round((summary.totalSize / STORAGE_QUOTA) * 100)) : 0,
      },
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to list storage');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request, 'create');

    const formData = await request.formData().catch(() => null);
    if (!formData) return NextResponse.json({ error: 'Invalid upload payload' }, { status: 400 });

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const folder = String(formData.get('folder') ?? '').replace(/^\/+|\/+$/g, '');
    const name = sanitizeName(file.name);

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File exceeds the ${Math.round(MAX_FILE_SIZE / (1024 * 1024))} MB upload limit.` }, { status: 413 });
    }
    if (!ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))) {
      return NextResponse.json({ error: 'Only images and PDF files are allowed.' }, { status: 415 });
    }

    const path = folder ? `${folder}/${name}` : name;
    const { data, error } = await supabase.storage.from(BUCKET).upload(path, new Uint8Array(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
      cacheControl: '3600',
    });

    if (error) {
      if ((error as { message?: string }).message?.includes('already exists')) {
        return NextResponse.json({ error: `"${name}" already exists in this folder.` }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({
      file: {
        path: data?.path ?? path,
        name,
        size: file.size,
        contentType: file.type,
        publicUrl: supabase.storage.from(BUCKET).getPublicUrl(data?.path ?? path).data.publicUrl,
      },
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to upload file');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request, 'delete');

    const path = (request.nextUrl.searchParams.get('path') ?? '').replace(/^\/+|\/+$/g, '');
    if (!path) return NextResponse.json({ error: 'A path is required.' }, { status: 400 });

    const result = await removePath(supabase, path);

    return NextResponse.json({ success: true, kind: result.kind });
  } catch (error) {
    return jsonAdminError(error, 'Failed to delete file');
  }
}

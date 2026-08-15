'use client';

import { createBrowserClient } from '@/lib/supabase/browser';

/** Resolves the current Supabase access token for admin API calls. */
export async function getAdminToken(): Promise<string | null> {
  try {
    const supabase = createBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export class AdminClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminClientError';
    this.status = status;
  }
}

/** Authenticated fetch against an admin API route. Throws AdminClientError. */
export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAdminToken();
  const res = await fetch(path, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => null)) as { error?: string } | null;

  if (!res.ok) {
    throw new AdminClientError(body?.error ?? `Request failed (${res.status})`, res.status);
  }

  return body as T;
}

/** POST helper that serialises the payload and throws on failure. */
export async function adminPost<T>(path: string, payload: unknown): Promise<T> {
  return adminFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** PUT helper that serialises the payload and throws on failure. */
export async function adminPut<T>(path: string, payload: unknown): Promise<T> {
  return adminFetch<T>(path, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/** DELETE helper. */
export async function adminDelete<T>(path: string): Promise<T> {
  return adminFetch<T>(path, { method: 'DELETE' });
}

/** Multipart upload helper (used by the storage manager). */
export async function adminUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = await getAdminToken();
  const res = await fetch(path, {
    method: 'POST',
    body: formData,
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const body = (await res.json().catch(() => null)) as { error?: string } | null;

  if (!res.ok) {
    throw new AdminClientError(body?.error ?? `Upload failed (${res.status})`, res.status);
  }

  return body as T;
}

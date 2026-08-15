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

interface ErrorBody {
  error?: string;
  details?: {
    formErrors?: unknown[];
    fieldErrors?: Record<string, string[] | undefined>;
  };
}

/**
 * Builds a readable error message from an API error body. When Zod validation
 * fails the route returns `{ error, details: { fieldErrors } }` — this surfaces
 * exactly which field(s) failed instead of a generic "Validation failed".
 */
function buildErrorMessage(body: ErrorBody | null, status: number): string {
  if (!body) return `Request failed (${status})`;

  if (body.details && body.details.fieldErrors) {
    const fieldErrors = Object.entries(body.details.fieldErrors)
      .filter(([, messages]) => messages && messages.length > 0)
      .map(([field, messages]) => `${field}: ${messages!.join(', ')}`);
    if (fieldErrors.length > 0) {
      return `${body.error ?? 'Validation failed'} — ${fieldErrors.join(' · ')}`;
    }
  }

  return body.error ?? `Request failed (${status})`;
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

  const body = (await res.json().catch(() => null)) as ErrorBody | null;

  if (!res.ok) {
    throw new AdminClientError(buildErrorMessage(body, res.status), res.status);
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

  const body = (await res.json().catch(() => null)) as ErrorBody | null;

  if (!res.ok) {
    throw new AdminClientError(buildErrorMessage(body, res.status), res.status);
  }

  return body as T;
}

/** Downloads a binary file (PDF/Word/etc.) from an admin API route. */
export async function adminDownload(path: string, filename: string): Promise<void> {
  const token = await getAdminToken();
  const res = await fetch(path, {
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ErrorBody | null;
    throw new AdminClientError(buildErrorMessage(body, res.status), res.status);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

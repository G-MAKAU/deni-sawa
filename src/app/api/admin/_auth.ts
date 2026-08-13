import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export const BLOG_ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'support'] as const;
export type BlogAdminRole = (typeof BLOG_ADMIN_ROLES)[number];
export type BlogPermission = 'read' | 'create' | 'update' | 'delete';

const ROLE_PERMISSIONS: Record<BlogAdminRole, BlogPermission[]> = {
  super_admin: ['read', 'create', 'update', 'delete'],
  admin: ['read', 'create', 'update', 'delete'],
  manager: ['read', 'create', 'update', 'delete'],
  support: ['read', 'create', 'update'],
};

class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

function getAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  );
}

function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization');
  if (!header) return null;

  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

/**
 * Validates the caller's Supabase session and confirms they are an active
 * member of the Deni Sawa team with the requested permission. Returns a
 * user-scoped client so PostgREST applies RLS as the signed-in user — no
 * service-role key required.
 */
export async function requireBlogAdmin(request: NextRequest, permission: BlogPermission) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = getAnonKey();

  if (!url || !anonKey) {
    throw new AdminApiError('Supabase environment variables are not configured.', 500);
  }

  const token = getBearerToken(request);
  if (!token) {
    throw new AdminApiError('Authentication required.', 401);
  }

  const authClient = createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !user?.email) {
    throw new AdminApiError('Authentication required.', 401);
  }

  const supabase = createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: currentAdmin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', user.email.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  if (!currentAdmin) {
    throw new AdminApiError('Your account is not configured for admin access.', 403);
  }
  if (!currentAdmin.is_active) {
    throw new AdminApiError('Your admin account is inactive.', 403);
  }

  const permissions = ROLE_PERMISSIONS[currentAdmin.role as BlogAdminRole] ?? [];
  if (!permissions.includes(permission)) {
    throw new AdminApiError('You do not have permission to perform this action.', 403);
  }

  return { supabase, user, currentAdmin };
}

export function jsonAdminError(error: unknown, fallbackMessage: string) {
  if (error instanceof AdminApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error(fallbackMessage, error);
  return Response.json({ error: fallbackMessage }, { status: 500 });
}
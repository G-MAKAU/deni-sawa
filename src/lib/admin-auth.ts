import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';

export const ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'support'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AdminPermission = 'read' | 'create' | 'update' | 'delete';

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: ['read', 'create', 'update', 'delete'],
  admin: ['read', 'create', 'update', 'delete'],
  manager: ['read', 'create', 'update', 'delete'],
  support: ['read', 'create', 'update'],
};

export class AdminApiError extends Error {
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

export interface AdminContext {
  // Loosely typed — this project has no generated Database types, matching the
  // existing admin API routes (blog) which use the inferred `any` schema.
  supabase: SupabaseClient<any, any, any, any, any>;
  user: { id: string; email: string };
  currentAdmin: {
    id: string;
    email: string;
    full_name: string;
    role: AdminRole;
    is_active: boolean;
  };
}

export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

/**
 * Validates the caller's Supabase session and confirms they are an active
 * member of the Deni Sawa team with the requested permission. Returns a
 * user-scoped client so PostgREST applies RLS as the signed-in user — no
 * service-role key required.
 */
export async function requireAdmin(request: NextRequest, permission: AdminPermission): Promise<AdminContext> {
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
    .select('id, email, full_name, role, is_active')
    .eq('email', user.email.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  if (!currentAdmin) {
    throw new AdminApiError('Your account is not configured for admin access.', 403);
  }
  if (!currentAdmin.is_active) {
    throw new AdminApiError('Your admin account is inactive.', 403);
  }

  const permissions = ROLE_PERMISSIONS[currentAdmin.role as AdminRole] ?? [];
  if (!permissions.includes(permission)) {
    throw new AdminApiError('You do not have permission to perform this action.', 403);
  }

  return {
    supabase,
    user: { id: user.id, email: user.email },
    currentAdmin: {
      id: currentAdmin.id,
      email: currentAdmin.email,
      full_name: currentAdmin.full_name,
      role: currentAdmin.role as AdminRole,
      is_active: currentAdmin.is_active,
    },
  };
}

export function jsonAdminError(error: unknown, fallbackMessage: string) {
  if (error instanceof AdminApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error(fallbackMessage, error);
  return Response.json({ error: fallbackMessage }, { status: 500 });
}

/** Detects PostgREST row-level-security denials. */
export function isRlsError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const message = (error as { message?: string } | null)?.message ?? '';
  return code === '42501' || message.includes('row-level security') || message.includes('violates row-level security');
}

/**
 * Admin API error handler that turns RLS denials into an actionable message
 * instead of a generic 500. RLS denials on writes usually mean the admin
 * policies migration hasn't been applied or the service-role key is unset.
 */
export function jsonAdminWriteError(error: unknown, fallbackMessage: string) {
  if (error instanceof AdminApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (isRlsError(error)) {
    return Response.json(
      {
        error:
          'Action blocked by database permissions. Apply the admin policies migration (20260815000002_admin_team_policies.sql) or set SUPABASE_SERVICE_ROLE_KEY in your environment.',
      },
      { status: 500 }
    );
  }

  console.error(fallbackMessage, error);
  return Response.json({ error: fallbackMessage }, { status: 500 });
}

/**
 * Client for admin WRITE operations. Uses the service-role client when a key is
 * configured (bypasses RLS), otherwise falls back to the user-scoped client —
 * which works once the admin management policies are applied.
 */
export function adminWriteClient(context: AdminContext) {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? getServiceClient() : context.supabase;
}

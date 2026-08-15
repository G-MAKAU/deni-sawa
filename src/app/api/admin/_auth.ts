// Backwards-compatible facade — the canonical admin auth helpers now live in
// @/lib/admin-auth so all admin API routes share one implementation.
export {
  ADMIN_ROLES as BLOG_ADMIN_ROLES,
  AdminApiError,
  hasPermission,
  jsonAdminError,
  requireAdmin as requireBlogAdmin,
} from '@/lib/admin-auth';

export type { AdminPermission as BlogPermission, AdminRole as BlogAdminRole } from '@/lib/admin-auth';

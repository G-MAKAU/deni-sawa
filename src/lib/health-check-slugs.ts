/**
 * Slugs that are wired into the public site (routes, CTAs, deep links).
 * They must never be renamed or deleted, so the admin locks them.
 */
export const RESERVED_HEALTH_CHECK_SLUGS = ['business-health-check', 'professional-financial-health-check'] as const;

export type ReservedHealthCheckSlug = (typeof RESERVED_HEALTH_CHECK_SLUGS)[number];

export function isReservedHealthCheckSlug(slug: string | null | undefined): boolean {
  return Boolean(slug && (RESERVED_HEALTH_CHECK_SLUGS as readonly string[]).includes(slug));
}
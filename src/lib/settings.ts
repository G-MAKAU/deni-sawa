import 'server-only';
import { decryptSecret } from '@/lib/crypto';
import { getServiceClient } from '@/lib/supabase/service';

export interface AppSettingRow {
  key: string;
  value: string;
  is_secret: boolean;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  value: string | null;
  ts: number;
}

// In-memory TTL cache. On serverless this is per-instance, so an update
// propagates across instances within the TTL.
const cache = new Map<string, CacheEntry>();

function cached(key: string): CacheEntry | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry;
}

/** Clears the settings cache after an admin update so changes apply immediately. */
export function invalidateSettings(): void {
  cache.clear();
}

/**
 * Resolves a runtime setting from the `app_settings` table (DB-first), falling
 * back to the environment variable of the same name. Secret rows are decrypted
 * transparently. Results are cached for 60s.
 */
export async function getSetting(key: string): Promise<string | null> {
  const hit = cached(key);
  if (hit) return hit.value;

  let resolved: string | null = null;
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value, is_secret, description, updated_at, updated_by')
      .eq('key', key)
      .maybeSingle();

    if (!error && data) {
      const row = data as AppSettingRow;
      resolved = row.is_secret ? decryptSecret(row.value) : row.value;
    }
  } catch {
    // DB unavailable — fall through to env.
  }

  if (resolved === null) {
    resolved = process.env[key] ?? null;
  }

  cache.set(key, { value: resolved, ts: Date.now() });
  return resolved;
}

/** Convenience alias with the same semantics. */
export const getSecretSetting = getSetting;

/** Bulk-reads many settings in one round trip. */
export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {};
  const missing: string[] = [];

  for (const key of keys) {
    const hit = cached(key);
    if (hit) {
      out[key] = hit.value;
    } else {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    try {
      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value, is_secret, description, updated_at, updated_by')
        .in('key', missing);

      if (!error && data) {
        for (const row of data as AppSettingRow[]) {
          out[row.key] = row.is_secret ? decryptSecret(row.value) : row.value;
        }
      }
    } catch {
      // DB unavailable — fall through to env.
    }

    for (const key of missing) {
      if (!(key in out)) {
        out[key] = process.env[key] ?? null;
      }
      cache.set(key, { value: out[key], ts: Date.now() });
    }
  }

  return out;
}
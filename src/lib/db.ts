import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

/**
 * Server-only MySQL connection pool for the booking system.
 * Connects to the cPanel MySQL database — separate from Supabase.
 */
export function getBookingPool(): mysql.Pool {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'denisawa_booking',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
    ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  return pool;
}

/** Convenience wrapper — use query() not execute() for compatibility. */
export async function dbQuery<T = Record<string, unknown>[]>(
  sql: string,
  params?: unknown[]
): Promise<T> {
  const pool = getBookingPool();
  const [rows] = await pool.query(sql, params);
  return rows as T;
}

import { sql } from "drizzle-orm";
import { db } from "./client";

/**
 * Call a Postgres function (formerly a Supabase RPC) by name with positional
 * args, returning all result rows. Mirrors `supabase.rpc(name, args)` but runs
 * server-side over Drizzle. The function name is interpolated as a raw
 * identifier — only ever pass a hardcoded, trusted name (never user input).
 */
export async function callRpcRows<T = Record<string, unknown>>(
  fnName: string,
  args: unknown[],
): Promise<T[]> {
  const placeholders = args.map((a) => sql`${a}`);
  const joined = sql.join(placeholders, sql`, `);
  const result = await db.execute(
    sql`select * from ${sql.raw(fnName)}(${joined})`,
  );
  return (result.rows ?? result) as T[];
}

/** Same as callRpcRows but returns the first row (or null). */
export async function callRpcOne<T = Record<string, unknown>>(
  fnName: string,
  args: unknown[],
): Promise<T | null> {
  const rows = await callRpcRows<T>(fnName, args);
  return rows.length > 0 ? rows[0] : null;
}

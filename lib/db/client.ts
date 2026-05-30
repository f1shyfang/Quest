import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

/**
 * Server-side Drizzle client over Neon's HTTP driver. Stateless and
 * serverless-friendly — safe to import per-request. NEVER import this from a
 * file that can be bundled into the browser.
 */
export const db = drizzle(sql, { schema });

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. SERVER-SIDE ONLY.
 *
 * Bypasses RLS. Used by the backfill script (scripts/enrich-buildings.ts)
 * to write to building_enrichments. Never import this from any file that
 * could be bundled into the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

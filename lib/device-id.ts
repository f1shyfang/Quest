/**
 * Device-id identity helpers.
 *
 * UNSW Quest v1 doesn't use Supabase Auth. A per-browser UUID is generated
 * by middleware and persisted in the `quest_device_id` cookie. Server
 * components and client components both read it to identify the current
 * player and pass it into `quest_*` RPCs as `p_user_id`.
 *
 * The cookie itself is created/refreshed in `middleware.ts`; these helpers
 * only read it and assume middleware has already guaranteed its presence.
 */

import { cookies } from "next/headers";

export const COOKIE_NAME = "quest_device_id";

/**
 * Read the `quest_device_id` cookie from a server component / route handler.
 * Throws if the cookie is missing — middleware should always set it before
 * we get here, so a missing cookie indicates a misconfiguration.
 */
export async function getDeviceIdServer(): Promise<string> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) {
    throw new Error(
      `[device-id] Missing ${COOKIE_NAME} cookie on the server. ` +
        `Middleware should have set this — check that middleware.ts matches this route.`,
    );
  }
  return value;
}

/**
 * Read the `quest_device_id` cookie from a browser context. Throws if the
 * cookie is missing (which shouldn't happen — middleware sets it on the
 * first request).
 */
export function getDeviceIdClient(): string {
  if (typeof document === "undefined") {
    throw new Error(
      "[device-id] getDeviceIdClient() called outside the browser. " +
        "Use getDeviceIdServer() in server components.",
    );
  }
  const prefix = `${COOKIE_NAME}=`;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(prefix));
  if (!match) {
    throw new Error(
      `[device-id] Missing ${COOKIE_NAME} cookie in document.cookie. ` +
        `Middleware should have set this on the page load that delivered this script.`,
    );
  }
  return decodeURIComponent(match.slice(prefix.length));
}

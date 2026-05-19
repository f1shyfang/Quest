import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/device-id";

/**
 * Device-id proxy (Next.js 16 — renamed from middleware in v16).
 *
 * UNSW Quest v1 replaces Supabase Auth with a device-bound UUID stored in a
 * long-lived cookie. On every matched request we make sure that cookie
 * exists — generating + setting one on first visit so that downstream server
 * components (which read it synchronously) can always assume it's present.
 *
 * The cookie is intentionally readable by client JS (httpOnly:false) because
 * direct `supabase.rpc(...)` calls from the browser also need it as the
 * `p_user_id` parameter.
 */
export function proxy(request: NextRequest) {
  const existing = request.cookies.get(COOKIE_NAME)?.value;
  if (existing) {
    return NextResponse.next();
  }

  const id = crypto.randomUUID();

  // Make the cookie visible on `request.cookies` so that server components
  // rendering for THIS request can read it via `next/headers` `cookies()`.
  request.cookies.set(COOKIE_NAME, id);

  // Re-create the response now that `request.cookies` has been mutated so
  // the rebuilt request headers carry the new cookie downstream.
  const response = NextResponse.next({ request });

  // And persist it on the browser for subsequent requests.
  response.cookies.set(COOKIE_NAME, id, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365 * 5,
  });

  return response;
}

export const config = {
  // Match every path EXCEPT:
  //   - /_next/  (build assets, image optimizer, HMR)
  //   - /api/    (rooms API is anon — doesn't need device id)
  //   - /favicon.ico and any common static asset extension
  matcher: [
    "/((?!_next/|api/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json|woff|woff2|ttf|otf)$).*)",
  ],
};

# Changelog

All notable changes to this repository.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to a four-digit semver of `MAJOR.MINOR.PATCH.MICRO`.

## [0.1.0.0] - 2026-05-19

### Added

- **TableDrop V1**: four-page hackathon build for curated spontaneous tables at DevSoc Halftime.
  - Bounty feed at `/` with the seeded Halftime bounty pinned.
  - Joiner page `/b/[slug]` with anonymous Supabase auth, tag-chip form, live queue rank, accepted-state inline Check-in QR, and `?ci=<token>` auto-check-in.
  - Projector page `/room/[slug]` with Realtime subscription, 1s polling fallback on disconnect, refetch on `SUBSCRIBED`, and bounce-staggered row insert + name pulse motion (`globals.css`).
  - Host queue `/host/[slug]` gated on a session-stored admin token, with Accept/Reject and live counters for pending/accepted/present.
- Supabase schema (`profiles`, `bounties`, `bounty_requests`, `room_presence`) with row-level security, partial/composite indexes, REPLICA IDENTITY FULL, and `supabase_realtime` publication on both flow tables.
- SECURITY DEFINER RPCs: `request_to_join`, `accept_request` (host-admin-token gated, FOR UPDATE on the bounty row to serialize seat allocation), `reject_request`, `check_in` (full state machine — no auto-accept), `get_queue_rank`, `get_checkin_token`.
- Editorial visual identity wired via `lib/design-tokens.ts`, Instrument Serif display font, Geist body font, accent `#ff7a00`, motion tokens, and `prefers-reduced-motion` override.
- Typed RPC error parser `lib/rpc-errors.ts` shared across pages, including a specific path for Supabase's `anonymous_provider_disabled` so guests see "Sign-ins aren't enabled yet" instead of a generic error.

### Changed

- Proxy now refreshes Supabase cookies without redirecting unauthenticated visitors to `/auth/login` — every TableDrop page handles its own auth (anon for joiners, public for projector and feed, sessionStorage admin token for host).
- Root layout uses Instrument Serif + Geist via `next/font/google` and sets the dark editorial background by default in `globals.css`.
- `cacheComponents` disabled in `next.config.ts`; every server page declares `export const dynamic = "force-dynamic"` because reads are all cookie- or query-dependent.

### Security

- `bounties.checkin_token` access locked down: clients use the `bounties_public` view (column-level grant excludes the token) plus the `get_checkin_token` RPC that returns it only to an accepted joiner.
- `bounties_public` view runs in `security_invoker` mode so RLS applies to the querying user, not the view creator.
- `app_config` table holds the host admin secret with RLS enabled and no policies — only SECURITY DEFINER RPCs can read it.

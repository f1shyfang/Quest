# Free-Rooms API Backend — Resume Handoff (Post-Task-11)

**Saved:** 2026-05-19 (after Tasks 1, 3–11 landed)
**Branch:** `feat/free-rooms-api-backend` (16 commits ahead of `main`)
**Plan:** [`docs/unsw-quest/plans/2026-05-19-free-rooms-api-backend.md`](./2026-05-19-free-rooms-api-backend.md)
**Spec:** [`docs/unsw-quest/specs/2026-05-19-free-rooms-api-design.md`](../specs/2026-05-19-free-rooms-api-design.md)

---

## TL;DR

The Free-Rooms API backend is **functionally complete** — the public `GET /api/rooms/free` endpoint, the aggregator, all helpers, the Supabase table, and the Foursquare client are all merged and tested (44/44). What's left is **Tasks 12 and 13**, both of which are operator-gated on two secrets that need to land in `.env.local` before the work can proceed.

---

## Execution status

| Task | State | Commit |
|---|---|---|
| 0 — Bootstrap (vitest, tsx, proxy) | ✅ done | `af74ee9` |
| 1 — `building_enrichments` migration | ✅ done — applied to Supabase | `5d62438` |
| 2 — Freerooms types | ✅ done | `3e07e72` |
| 3 — Freerooms HTTP client | ✅ done — 4 tests | `3e6c390` |
| 4 — Haversine distance | ✅ done — 4 tests | `76aba6d` |
| 5 — Name similarity scorer | ✅ done — 6 tests | `1ca7e19` |
| 6 — Confidence classifier | ✅ done — +5 tests | `1bc9451` |
| 7 — Best-candidate picker | ✅ done — +4 tests | `20ba86e` |
| 8 — Foursquare HTTP client | ✅ done — 6 tests | `b9e7b43` |
| 9 — Supabase service-role admin | ✅ done | `57b70e7` |
| 10 — Aggregation service | ✅ done — 8 tests | `6789e24` |
| 11 — Public route handler | ✅ done — 7 tests | `ded9b55` |
| **12 — Backfill script** | 🔒 **operator-gated** | — |
| **13 — End-to-end smoke test** | 🔒 **operator-gated** (depends on 12) | — |

Suite total: **44/44** passing. Lint clean modulo the pre-existing `tailwind.config.ts:62` baseline (unrelated to this branch).

```bash
git log --oneline main..HEAD     # 16 commits ahead of main
npm run test:run                 # 44/44
npm run lint                     # one pre-existing baseline failure in tailwind.config.ts:62
```

---

## What's needed to unblock Tasks 12 + 13

Two secrets must be in `/mnt/d/Documents/devsoc_halftime/.env.local`:

```dotenv
FOURSQUARE_API_KEY=...           # sign up at https://foursquare.com/developers
SUPABASE_SERVICE_ROLE_KEY=...    # Supabase dashboard → Settings → API → service_role secret
```

Plus the already-required:
```dotenv
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Supabase project ref: **`vpwrrlkeinfjxoiaetwf`**.

---

## Resume steps

### Step A — Land the secrets

Get the two secrets above into `.env.local` (not committed; the file is gitignored).

### Step B — Execute Task 12 (backfill script)

Re-invoke `superpowers:subagent-driven-development` or just dispatch one implementer subagent on **Task 12** from the plan. Outline (full code is in the plan):

1. Create `scripts/enrich-buildings.ts` — TypeScript Node script run via `tsx` that:
   - Pulls all buildings from Freerooms (`createFreeroomsClient`).
   - Loops, searching Foursquare within 100m of each, scoring candidates with `nameSimilarity` + `classifyConfidence` + `pickBestCandidate`.
   - Fetches the first photo for the best match.
   - Upserts into `building_enrichments` via `createAdminClient()` (service-role, bypasses RLS).
   - Skips rows already marked `match_method = 'manual'`.
   - Logs a per-building line and a final summary.

2. Run it:
   ```bash
   npx --yes dotenv-cli -e .env.local -- npm run enrich
   # (tsx doesn't auto-load .env.local; dotenv-cli wraps the run)
   ```

3. Spot-check the data:
   ```sql
   select match_confidence, count(*) from public.building_enrichments group by 1 order by 1;
   select building_id, building_name, foursquare_place_id, address, photo_url
     from public.building_enrichments where match_confidence = 'low' limit 5;
   ```

4. Manually fix obvious wrongs by editing the row and setting `match_method = 'manual'`. Future runs preserve manual rows.

5. Commit: `feat(scripts): add Foursquare building enrichment backfill` (also commits any new dev dep like `dotenv-cli` if added).

### Step C — Execute Task 13 (smoke test)

No new code — manual end-to-end verification.

1. `npm run dev` (Next.js on http://localhost:3000)
2. `curl -s 'http://localhost:3000/api/rooms/free' | head -c 800` → expect 200 with `as_of` + `rooms[]`, at least one `building.photo_url` populated.
3. `curl -s 'http://localhost:3000/api/rooms/free?capacity=100&usage=LCTR&status=soon' | head -c 400` → filtered.
4. `curl -s 'http://localhost:3000/api/rooms/free?near_lat=-33.9173&near_lng=151.2336' | jq '[.rooms[:5] | .[] | .building.id]'` → buildings near the library lawn.
5. `curl -s -o /dev/null -w '%{http_code}\n' 'http://localhost:3000/api/rooms/free?usage=NOPE'` → `400`.

### Step D — Finish the branch

Once Tasks 12 + 13 are green, invoke `superpowers:finishing-a-development-branch` to choose merge/PR strategy.

---

## Non-blocking follow-ups (from the final cross-cutting review)

These are intentional plan decisions or low-risk DX gaps — none block merge, but track them for v2:

- **`?near_lat` without `?near_lng` silently no-ops the sort.** Could 400 if exactly one is present.
- **`/api/*` auth-bypass is unbounded** (set in `lib/supabase/proxy.ts`). Fine for a single public route; narrow to `/api/rooms` or add a comment if more routes get added.
- **Task 10 silently swallows Supabase failures** in `lib/rooms/get-free-rooms.ts` (`.catch(() => [])`). The plan made this a soft-fail by design and a test pins it. A `console.warn` would improve observability without changing behavior.
- **`unstable_cache` + Vercel Edge runtime caveat.** If deployed to Edge, errors crossing the cache boundary may lose `instanceof FreeroomsError` identity. Safe for local Next or standard Node; revisit before Edge deploy.
- **`scripts/enrich-buildings.ts` script entry in `package.json` points at a file that doesn't exist yet** — created by Task 12.

---

## Architecture summary (for a fresh reader)

Five small modules wired together by the route handler:

```
GET /api/rooms/free  (app/api/rooms/free/route.ts)
        │
        ├─ unstable_cache(getBuildings, 24h)
        ├─ unstable_cache(getRooms, 24h)
        └─ getFreeRooms(params, deps)        (lib/rooms/get-free-rooms.ts)
               │
               ├─ FreeroomsClient            (lib/freerooms/client.ts)   ← live status, no cache
               ├─ readEnrichments via anon-key Supabase   (RLS read-public)
               └─ haversineMeters for ?near_lat/?near_lng sort
```

Backfill (Task 12) is a separate offline pipeline:
```
scripts/enrich-buildings.ts
   ├─ FreeroomsClient.getBuildings
   ├─ FoursquareClient.searchNearby + getFirstPhoto    (lib/foursquare/client.ts)
   ├─ nameSimilarity → pickBestCandidate → classifyConfidence   (lib/foursquare/match.ts)
   └─ createAdminClient().from("building_enrichments").upsert
```

Design decisions locked in (do not re-litigate):
- Public endpoint, no auth (Freerooms is public; photos are CDN-public).
- 24h `unstable_cache` for static; live status uncached.
- Backfill is an on-demand `npm run enrich` script, not a cron.
- Supabase RLS: read-public, writes only via service-role.

---

## Things to know about the repo state

- **Git state:** branch is rebased on top of main; no uncommitted changes are expected when picking this up.
- **Tooling installed by Task 0:** `vitest`, `@vitest/coverage-v8`, `tsx`. `vitest.config.ts` aliases `@/*` → `./*`.
- **The `building_enrichments` table exists** in Supabase project `vpwrrlkeinfjxoiaetwf` (migration applied, RLS enabled, public-read policy in place). It's **empty** — Task 12 populates it.
- **Pre-existing baseline:** `tailwind.config.ts:62` has a `require()`-style import that lint flags. Predates this branch. Don't touch.
- **`gstack` is removed** from this repo (CLAUDE.md, hooks, .gitmodules all stripped in commit `3fe462d`). Don't reinstall.

---

## Reading order for whoever picks this up

1. **This file** (you are here).
2. **The plan:** [`2026-05-19-free-rooms-api-backend.md`](./2026-05-19-free-rooms-api-backend.md), specifically **Task 12** and **Task 13** sections (lines ~1808–2076).
3. **The spec** (only if a Task 12/13 decision feels ambiguous): [`2026-05-19-free-rooms-api-design.md`](../specs/2026-05-19-free-rooms-api-design.md).
4. **The PRD** (only for big-picture context): [`PRD_v1.md`](../PRD_v1.md).

---

*Delete this file once Tasks 12 and 13 are done and the branch is merged.*

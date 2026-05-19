# UNSW Quest

A location-based scavenger hunt game for the UNSW Kensington campus. Players scan a QR, enter a name, race through riddles and anagrams tied to real places, scan or type geocache codes at each stop, and finish on a live leaderboard.

**Built on** Next.js 16 (App Router) + Supabase (Postgres, Storage, Realtime, Edge Functions). Mobile-first, designed for iPhone 14–16 viewports; pitched in Firefox's responsive mobile visualiser.

> **Status:** Hackathon MVP build in progress. The backend (schema + RPCs + edge functions) is live; the player frontend at `/app/quest/*` is wired up but **migrations 00002–00006 must be applied to the live Supabase project before the app will work end-to-end**. See [`docs/unsw-quest/HANDOVER.md`](docs/unsw-quest/HANDOVER.md) for the current state and the unblock list.

---

## Docs

Start here, in order:

| Doc | Purpose |
|---|---|
| [`docs/unsw-quest/spec_sheet_v1.md`](docs/unsw-quest/spec_sheet_v1.md) | Engineering spec sheet — **current build target**. Demo user flow, MVP feature set, data model, stretch goals. |
| [`docs/unsw-quest/HANDOVER.md`](docs/unsw-quest/HANDOVER.md) | What's on `main` today, what's blocking the demo, and the next steps in order. |
| [`docs/unsw-quest/PRD_v1.md`](docs/unsw-quest/PRD_v1.md) | Original product requirements. Strategy, personas, and roadmap are still current; auth + verification + team model are **superseded by the spec sheet**. |
| [`docs/unsw-quest/clue_content_v1.md`](docs/unsw-quest/clue_content_v1.md) | Seed content: hero hunt + mini hunt riddles. |
| [`docs/unsw-quest/campus_tips_v1.md`](docs/unsw-quest/campus_tips_v1.md) | UNSW Kensington campus tips & fun facts feeding clue content. |
| [`design/unsw-quest/wireframes.html`](design/unsw-quest/wireframes.html) | Wireframes (single HTML, open in a browser). |

---

## Quick start

### Prerequisites

- Node.js 20+
- Supabase project (env vars below)
- Supabase CLI for migrations (optional but recommended)

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` → `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...           # for migrations + edge fn
```

### 3. Apply database migrations

```bash
supabase db push
```

Migrations live in [`supabase/migrations/`](supabase/migrations/) and must be applied in order:

| # | Migration | Purpose |
|---|---|---|
| `…000000` | `building_enrichments` | Foursquare-enriched building metadata table |
| `…000001` | `quest_schema` | 7 `quest_*` tables + RPCs + RLS |
| `…000002` | `seed_quest_content` | Seed 2 hunts + 12 clues |
| `…000003` | `results_cards_bucket` | Storage bucket for end-of-hunt PNGs |
| `…000004` | `quest_photos_bucket` | Storage bucket for player photos |
| `…000005` | `abandon_idle_sessions` | `pg_cron` job to mark idle sessions abandoned |
| `…000006` | `remove_auth_use_device_id` | Drop `auth.uid()`, switch RPCs to `p_user_id` |

Live status of each migration is tracked in `HANDOVER.md`.

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000/quest/demo> in **Firefox** with the responsive mobile visualiser set to **iPhone 14 / 15 / 16** (390–430px wide, portrait).

---

## Repo structure

```
app/
  api/rooms/free/        # Free-Rooms API (campus building data)
  quest/                 # Player frontend
    demo/[huntSlug]/     # Hunt runtime (lobby, play, finale, standings)
    _components/         # Phone frame, reticle
    _screens/            # Reusable clue/qr/photo/leaderboard screens
    _registry.ts         # Screen + variant registry
    quest.css            # Quest-specific styling
components/              # Shared UI (shadcn/ui)
lib/
  device-id.{ts,server.ts}   # Anonymous device identity (cookie-based)
  foursquare/                # Foursquare Places API client
  freerooms/                 # UNSW Freerooms client
  rooms/                     # Free-room aggregation logic
  supabase/                  # Supabase clients (browser, server, admin)
proxy.ts                 # Next.js 16 middleware (sets quest_device_id cookie)
supabase/
  functions/generate_results_card/    # Edge fn — renders 9:16 PNG (satori + resvg-wasm)
  migrations/                          # SQL migrations
scripts/
  enrich-buildings.ts    # Foursquare backfill for building_enrichments
docs/unsw-quest/         # PRD, spec sheet, content, handover
design/unsw-quest/       # Wireframes
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind, shadcn/ui |
| Identity | Device-id UUID in cookie, set by `proxy.ts` (no auth in MVP) |
| Backend | Supabase Postgres + Storage + Realtime |
| Server logic | Supabase Edge Functions (Deno), Postgres RPCs |
| Results card | `satori` + `resvg-wasm` rendering 9:16 PNG server-side |
| Hosting | Vercel (intended) |
| Tests | Vitest |

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Run prod build |
| `npm run lint` | ESLint |
| `npm test` | Vitest (watch) |
| `npm run test:run` | Vitest (single pass) |
| `npm run enrich` | Backfill `building_enrichments` via Foursquare |

---

## Contributing notes

- The PRD and the spec sheet sometimes disagree — when they do, **the spec sheet wins** (it captures the hackathon MVP pivot: Kahoot-style join, anagram + geocache puzzles, individual play, no GPS verification).
- Auth is intentionally absent. Identity = `quest_device_id` cookie. Don't reintroduce `auth.uid()` in RPCs.
- The current `/app/quest/*` code still reflects the older team/GPS model in places. Reconciling it with the spec sheet's MVP flow is open work — see HANDOVER.

---

*UNSW Quest — DevSoc Halftime Hackathon 2026.*

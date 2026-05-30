-- Expand the UNSW 101 hero hunt from 9 → 18 clues.
--
-- APPLY (against the live Neon DB, same way as db/functions.sql):
--   psql "$DATABASE_URL" -f db/seed-quest-unsw101-expansion.sql
-- drizzle-kit owns table DDL only; data seeds are applied manually via psql.
-- Plain Postgres — fully-qualified public.* names, no Supabase-only features.
--
-- Adds 3 clues to each of the 3 existing tiers, mixing all three verification
-- types and covering UNSW Kensington landmarks not yet used by the original
-- v1 seed. Voice/format match the existing clues and
-- docs/unsw-quest/clue_content_v1.md.
--
-- HUNT ID IS LOOKED UP BY SLUG, not hardcoded: the live Neon DB's UNSW 101 hunt
-- was regenerated with a fresh uuid during the Supabase→Neon migration, so the
-- v1 hardcoded hunt id (11111111-…-0001) does NOT exist there. Resolving via
-- slug keeps this script correct in every environment.
--
-- Idempotent: new rows use hardcoded uuids + ON CONFLICT (id) DO NOTHING; the
-- finale bump matches by location_name (stable) and is value-stable; the
-- metadata UPDATE is value-stable. Re-running is a no-op.
--
-- Decisions for fields the content doc does not specify:
--   * New-clue uuids reuse the hero-hunt scheme '22222222-0001-4101-8101-
--     0000000000<tier><seq>' for the seq slots the v1 seed never used; these
--     are free in every environment (v1 only defined seq 1–3 per tier).
--   * `qr_code_payload`: deterministic 'QUEST_v1_unsw101_t<tier>_s<seq>' so
--     laminated codes can be generated to match (same convention as v1).
--   * Coordinates are hand-placed near each real landmark (approximate, like
--     the v1 seed) — field-verify before a live event.
--
-- FINALE ORDERING: quest_unlock_clue() advances current_sequence by +1 up to
-- max(sequence_in_tier) for the tier, so sequences within a tier MUST stay
-- contiguous (1..N) — gaps would strand a player on a non-existent clue.
-- The finale ("End where you began… officially a UNSW student") sits at tier 3,
-- seq 3. We insert the three new tier-3 clues at seq 3,4,5 and move the finale
-- to seq 6 so it stays the contiguous last clue. (Tiers 1 & 2 already end at
-- seq 3, so their new clues simply extend to 4,5,6.)

-- Resolve the hunt id by slug into the psql variable :hunt_id.
select id as hunt_id from public.quest_hunts where slug = 'unsw-101' \gset

-- =============================================================================
-- 1. Keep the finale last & contiguous: move it (tier-3 seq 3) → seq 6
-- =============================================================================

update public.quest_clues
set sequence_in_tier = 6
where hunt_id = :'hunt_id'::uuid
  and location_name = 'Library Lawn — centre of the grass';

-- =============================================================================
-- 2. Refresh the hero-hunt metadata for the larger hunt
-- =============================================================================

update public.quest_hunts
set
  description = 'The hero hunt: 18 clues across 3 tiers covering the icons of UNSW Kensington. Upper campus to south spread and back to Library Lawn.',
  duration_minutes = 135
where slug = 'unsw-101';

-- =============================================================================
-- 3. New clues — attached to the resolved UNSW 101 hunt id
-- =============================================================================

insert into public.quest_clues (
  id, hunt_id, tier, sequence_in_tier, type,
  body_text, image_url, verification_type,
  location_name, location_lat, location_lng, geofence_radius_m,
  qr_code_payload, photo_challenge_prompt, hints
) values
  -- Tier 1.4 — Basser Steps
  (
    '22222222-0001-4101-8101-000000000014'::uuid,
    :'hunt_id'::uuid,
    1, 4, 'riddle',
    'Ninety-odd reasons to skip leg day. Climb me from the parade below and you''ll have earned your place on upper campus.',
    null,
    'gps',
    'Basser Steps — top landing',
    -33.9168, 151.2280, 25,
    null,
    null,
    '["The steep staircase up from Anzac Parade.", "Basser Steps, near Gate 2."]'::jsonb
  ),
  -- Tier 1.5 — The Quadrangle
  (
    '22222222-0001-4101-8101-000000000015'::uuid,
    :'hunt_id'::uuid,
    1, 5, 'riddle',
    'Four wings wrapped around an open heart of lawn — the oldest, proudest face the university owns.',
    null,
    'gps_plus_photo',
    'The Quadrangle — central lawn',
    -33.9177, 151.2299, 30,
    null,
    'Throw your best graduation-day pose on the Quad lawn.',
    '["The original courtyard building with a lawn in the middle.", "The Quadrangle, upper campus."]'::jsonb
  ),
  -- Tier 1.6 — Science Theatre
  (
    '22222222-0001-4101-8101-000000000016'::uuid,
    :'hunt_id'::uuid,
    1, 6, 'riddle',
    'Tiered like a colosseum and packed for first-year chem. When two hundred students gasp at a single reaction, it happens inside me.',
    null,
    'qr',
    'Science Theatre — main entrance',
    -33.9185, 151.2293, 25,
    'QUEST_v1_unsw101_t1_s6',
    null,
    '["A giant raked lecture theatre where the sciences gather.", "The Science Theatre, lower campus."]'::jsonb
  ),
  -- Tier 2.4 — Mathews Building / Theatres
  (
    '22222222-0001-4101-8101-000000000024'::uuid,
    :'hunt_id'::uuid,
    2, 4, 'riddle',
    'A tower of arts with theatres stacked beneath it. Sociology lives up high; your 9am tutorial hides down low.',
    null,
    'gps',
    'Mathews Building — forecourt',
    -33.9183, 151.2312, 30,
    null,
    null,
    '["The tall building sitting above a row of numbered theatres.", "Mathews Building and the Mathews Theatres."]'::jsonb
  ),
  -- Tier 2.5 — Tyree Energy Technologies Building
  (
    '22222222-0001-4101-8101-000000000025'::uuid,
    :'hunt_id'::uuid,
    2, 5, 'riddle',
    'Glass and timber that practise what they preach — I help generate the very power I spend teaching about.',
    null,
    'qr',
    'Tyree Energy Technologies Building (TETB) — entrance',
    -33.9192, 151.2298, 25,
    'QUEST_v1_unsw101_t2_s5',
    null,
    '["A sustainability-focused building that shows off its green design.", "The Tyree Energy Technologies Building, TETB."]'::jsonb
  ),
  -- Tier 2.6 — The Village Green
  (
    '22222222-0001-4101-8101-000000000026'::uuid,
    :'hunt_id'::uuid,
    2, 6, 'riddle',
    'No lectures here — only lungs and legs. Touch football, sunburn, and the occasional carnival call me home.',
    null,
    'gps_plus_photo',
    'The Village Green — centre of the field',
    -33.9195, 151.2282, 40,
    null,
    'Team jump shot — everyone airborne at once on the green.',
    '["The big open sports field on lower campus.", "The Village Green."]'::jsonb
  ),
  -- Tier 3.3 — The Chancellery
  (
    '22222222-0001-4101-8101-000000000034'::uuid,
    :'hunt_id'::uuid,
    3, 3, 'riddle',
    'Where the signatures that matter most are signed, and the people who run the whole place keep the lights on late.',
    null,
    'gps',
    'The Chancellery — main entrance',
    -33.9168, 151.2290, 25,
    null,
    null,
    '["The administrative heart of campus — the VC works here.", "The Chancellery building, upper campus."]'::jsonb
  ),
  -- Tier 3.4 — UNSW Light Rail stop
  (
    '22222222-0001-4101-8101-000000000035'::uuid,
    :'hunt_id'::uuid,
    3, 4, 'riddle',
    'Steel snakes glide where buses once crawled. Tap on here and the city is twenty quiet minutes away.',
    null,
    'qr',
    'UNSW High Street light rail stop — platform',
    -33.9168, 151.2270, 25,
    'QUEST_v1_unsw101_t3_s4',
    null,
    '["Where the L2 and L3 trams pause beside campus.", "The UNSW High Street light rail stop on Anzac Parade."]'::jsonb
  ),
  -- Tier 3.5 — Squarehouse / Esme Timbery Creative Practice Lab
  (
    '22222222-0001-4101-8101-000000000036'::uuid,
    :'hunt_id'::uuid,
    3, 5, 'riddle',
    'My rounder neighbour gets the fame, but I keep the corners. Makers, painters, and printmakers gather where I stand.',
    null,
    'gps_plus_photo',
    'The Squarehouse / Esme Timbery Creative Practice Lab',
    -33.9186, 151.2286, 25,
    null,
    'Frame the most colourful wall you can find and pose like its newest exhibit.',
    '["The creative-practice space right beside the Roundhouse.", "The Squarehouse, home of the Esme Timbery Creative Practice Lab."]'::jsonb
  )
on conflict (id) do nothing;

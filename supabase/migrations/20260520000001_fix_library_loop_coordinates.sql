-- =============================================================================
-- 20260520000001_fix_library_loop_coordinates
--
-- Bug: the three library-loop clues were seeded with coordinates ~190 m west
-- of the actual UNSW Main Library — the geofences landed on the Quadrangle
-- area, not the Library, so the in-app map looked obviously wrong.
--
-- Authoritative coordinates pulled from OpenStreetMap on 2026-05-20:
--   - UNSW Library      (node 9559160181) — -33.9175178, 151.2334236
--   - Library Walk      (way  9784780)    — centre -33.9179698, 151.2341925
--   - Library Lawn      (way  45488366)   — centre -33.9167601, 151.2335534
--
-- Note: the original seed file
-- (20260519000002_seed_quest_content.sql) still carries the bad numbers so
-- that re-running it from scratch reproduces the historical state; this
-- migration is the source of truth going forward. If you ever wipe + reseed,
-- update the seed file too.
-- =============================================================================

update public.quest_clues
set location_lat = -33.9175178,
    location_lng = 151.2334236
where id = '33333333-0002-4102-8102-000000000011'::uuid;

update public.quest_clues
set location_lat = -33.9179698,
    location_lng = 151.2341925
where id = '33333333-0002-4102-8102-000000000012'::uuid;

update public.quest_clues
set location_lat = -33.9167601,
    location_lng = 151.2335534
where id = '33333333-0002-4102-8102-000000000013'::uuid;

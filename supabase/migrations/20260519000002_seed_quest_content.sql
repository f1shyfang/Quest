-- Seed v1 quest content: two hunts (UNSW 101 hero + Library Loop mini) and
-- all their clues. Sourced verbatim from docs/unsw-quest/clue_content_v1.md
-- and structured per PRD_v1.md §4.1, §5.4.
--
-- Idempotent: every row uses ON CONFLICT (id) DO NOTHING with hardcoded UUIDs
-- so re-running this migration is a no-op.
--
-- Decisions made for fields the content doc does not specify (documented in
-- the agent report):
--   * `type` defaults to 'riddle' for all clues except 3.1 Red Centre, which
--     is explicitly an image clue. image_url is left NULL (asset not yet
--     produced — caption text is in body_text).
--   * `recommended_team_size`: '2-6' for the hero hunt (PRD §5.1 default),
--     '1-4' for the mini hunt (demo / tutorial scale).
--   * `duration_minutes`: midpoint of the PRD range — 68 for Hero, 18 for Mini.
--   * `hero_emoji`: 🗺️ for Hero, 📚 for Library Loop.
--   * `qr_code_payload`: deterministic string 'QUEST_v1_<hunt>_<tier>_<seq>'
--     for every `qr` clue so laminated codes can be generated to match.
--   * `photo_challenge_prompt`: set only on `gps_plus_photo` clues; pulled
--     verbatim from the content doc.

-- =============================================================================
-- Hunts
-- =============================================================================

insert into public.quest_hunts (
  id, slug, name, description, duration_minutes,
  recommended_team_size, hero_emoji, status
) values
  (
    '11111111-1111-4111-8111-000000000001'::uuid,
    'unsw-101',
    'UNSW 101',
    'The hero hunt: 9 clues across 3 tiers covering the icons of UNSW Kensington. Upper campus to south spread and back to Library Lawn.',
    68,
    '2-6',
    '🗺️',
    'published'
  ),
  (
    '11111111-1111-4111-8111-000000000002'::uuid,
    'library-loop',
    'Library Loop',
    'A 15–20 minute mini hunt around the Main Library — three clues, one of each verification type. Perfect for a live demo or a soft tutorial.',
    18,
    '1-4',
    '📚',
    'published'
  )
on conflict (id) do nothing;

-- =============================================================================
-- Clues — UNSW 101 (hunt 11111111-...-000000000001)
-- =============================================================================

insert into public.quest_clues (
  id, hunt_id, tier, sequence_in_tier, type,
  body_text, image_url, verification_type,
  location_name, location_lat, location_lng, geofence_radius_m,
  qr_code_payload, photo_challenge_prompt, hints
) values
  -- Tier 1.1 — The Library (main entrance)
  (
    '22222222-0001-4101-8101-000000000011'::uuid,
    '11111111-1111-4111-8111-000000000001'::uuid,
    1, 1, 'riddle',
    'I hold thousands of worlds but never leave my shelf. Stand at my doors and you stand where every essay deadline ends.',
    null,
    'gps_plus_photo',
    'Main Library — front doors',
    -33.9173, 151.2313, 25,
    null,
    'Hold up your favourite imaginary book for a team photo at the entrance.',
    '["Think about what holds worlds you can travel to.", "You''ll find it where students go to study — the main one."]'::jsonb
  ),
  -- Tier 1.2 — John Niland Scientia
  (
    '22222222-0001-4101-8101-000000000012'::uuid,
    '11111111-1111-4111-8111-000000000001'::uuid,
    1, 2, 'riddle',
    'A blade of glass rises from the lawn, slicing the sky in half. Find me where every graduate poses and every thesis is defended.',
    null,
    'gps',
    'John Niland Scientia Building',
    -33.9170, 151.2305, 30,
    null,
    null,
    '["The most photographed building on campus.", "Glass and steel, between Library Walk and Anzac Parade."]'::jsonb
  ),
  -- Tier 1.3 — The Roundhouse
  (
    '22222222-0001-4101-8101-000000000013'::uuid,
    '11111111-1111-4111-8111-000000000001'::uuid,
    1, 3, 'riddle',
    'I''m shaped like none of my neighbours. Friday nights I''m loudest, and freshers'' livers fear me most.',
    null,
    'qr',
    'Roundhouse — southern external wall',
    -33.9181, 151.2289, 25,
    'QUEST_v1_unsw101_t1_s3',
    null,
    '["Famous for trivia, gigs, and cheap drinks.", "The circular Arc venue."]'::jsonb
  ),
  -- Tier 2.1 — Law Building
  (
    '22222222-0001-4101-8101-000000000021'::uuid,
    '11111111-1111-4111-8111-000000000001'::uuid,
    2, 1, 'riddle',
    'Future arguments are born here. Every objection in this city starts in one of my classrooms first.',
    null,
    'gps',
    'UNSW Law Building — main entrance',
    -33.9159, 151.2286, 25,
    null,
    null,
    '["What kind of profession argues for a living?", "Look for the faculty named after a courtroom skill."]'::jsonb
  ),
  -- Tier 2.2 — Arc Precinct
  (
    '22222222-0001-4101-8101-000000000022'::uuid,
    '11111111-1111-4111-8111-000000000001'::uuid,
    2, 2, 'riddle',
    'Where clubs recruit and free pizza appears. I take many forms during O-Week — bring a tote bag.',
    null,
    'qr',
    'Arc @ UNSW — Blockhouse / Quad Lawn entrance',
    -33.9166, 151.2300, 25,
    'QUEST_v1_unsw101_t2_s2',
    null,
    '["Think about the central student hub.", "Where societies gather to sign people up."]'::jsonb
  ),
  -- Tier 2.3 — Physics Lawn (Einstein)
  (
    '22222222-0001-4101-8101-000000000023'::uuid,
    '11111111-1111-4111-8111-000000000001'::uuid,
    2, 3, 'riddle',
    'He thought in pictures, dreamed in equations, and famously had his tongue out. Find the lawn that bears his thoughtful silhouette.',
    null,
    'gps_plus_photo',
    'Physics Lawn — near the Albert Einstein bust',
    -33.9176, 151.2316, 20,
    null,
    'Recreate the Einstein pose at the bust.',
    '["Famous physicist, famous hair.", "Look for the bust of the relativistic German on the Physics Lawn."]'::jsonb
  ),
  -- Tier 3.1 — The Red Centre (image clue)
  (
    '22222222-0001-4101-8101-000000000031'::uuid,
    '11111111-1111-4111-8111-000000000001'::uuid,
    3, 1, 'image_clue',
    'Find this building. (Cropped photo of one of the Red Centre''s distinctive brick cube corners.)',
    null,
    'gps',
    'Red Centre — central courtyard',
    -33.9189, 151.2305, 30,
    null,
    null,
    '["Engineering students see this every day.", "Cube-shaped, brick-red, southern half of campus."]'::jsonb
  ),
  -- Tier 3.2 — Sir John Clancy Auditorium
  (
    '22222222-0001-4101-8101-000000000032'::uuid,
    '11111111-1111-4111-8111-000000000001'::uuid,
    3, 2, 'riddle',
    'I host the biggest classes on campus and the loudest applause. Named for a knight who served students, not kings.',
    null,
    'gps',
    'Sir John Clancy Auditorium — main entrance',
    -33.9171, 151.2295, 25,
    null,
    null,
    '["The largest lecture theatre on campus.", "The round auditorium between the Quad and the Mathews Building."]'::jsonb
  ),
  -- Tier 3.3 — Library Lawn (Finale)
  (
    '22222222-0001-4101-8101-000000000033'::uuid,
    '11111111-1111-4111-8111-000000000001'::uuid,
    3, 3, 'riddle',
    'End where you began, but a few steps closer to the sun. Lie down on the grass and you''re officially a UNSW student.',
    null,
    'gps_plus_photo',
    'Library Lawn — centre of the grass',
    -33.9172, 151.2310, 40,
    null,
    'Team starfish on the grass — group photo from above, all of you flat on your backs.',
    '["Where students nap between lectures.", "The big grassy lawn outside the main Library."]'::jsonb
  )
on conflict (id) do nothing;

-- =============================================================================
-- Clues — Library Loop (hunt 11111111-...-000000000002)
-- =============================================================================

insert into public.quest_clues (
  id, hunt_id, tier, sequence_in_tier, type,
  body_text, image_url, verification_type,
  location_name, location_lat, location_lng, geofence_radius_m,
  qr_code_payload, photo_challenge_prompt, hints
) values
  -- M.1 — The Library entrance
  (
    '33333333-0002-4102-8102-000000000011'::uuid,
    '11111111-1111-4111-8111-000000000002'::uuid,
    1, 1, 'riddle',
    'I hold thousands of worlds but never leave my shelf.',
    null,
    'gps',
    'Main Library — front doors',
    -33.9173, 151.2313, 25,
    null,
    null,
    '["What holds worlds you can travel to?", "The main library — front entrance."]'::jsonb
  ),
  -- M.2 — Library Walk
  (
    '33333333-0002-4102-8102-000000000012'::uuid,
    '11111111-1111-4111-8111-000000000002'::uuid,
    1, 2, 'riddle',
    'Step onto the path where students protest, picnic, and pose in graduation gowns. Find me where four sides meet a centre.',
    null,
    'qr',
    'Library Walk — near the midpoint sculpture',
    -33.9168, 151.2308, 25,
    'QUEST_v1_libloop_t1_s2',
    null,
    '["The famous central walkway.", "Library Walk, near the centre sculpture."]'::jsonb
  ),
  -- M.3 — Library Lawn (Finale)
  (
    '33333333-0002-4102-8102-000000000013'::uuid,
    '11111111-1111-4111-8111-000000000002'::uuid,
    1, 3, 'riddle',
    'End where you began, but a few steps to the sun.',
    null,
    'gps_plus_photo',
    'Library Lawn — centre of the grass',
    -33.9172, 151.2310, 40,
    null,
    'All hands in the centre, fingertips touching — team huddle photo from above.',
    '["The grass right outside the Library.", "Library Lawn."]'::jsonb
  )
on conflict (id) do nothing;

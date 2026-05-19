-- Enrichment metadata for Freerooms buildings, sourced from Foursquare.
-- One row per Freerooms building_id. Populated by scripts/enrich-buildings.ts.

create table public.building_enrichments (
  building_id          text primary key,
  building_name        text not null,
  foursquare_place_id  text,
  photo_url            text,
  address              text,
  match_confidence     text not null
    check (match_confidence in ('high', 'medium', 'low', 'no_match')),
  match_method         text
    check (match_method in ('name_and_proximity', 'proximity_only', 'manual')),
  enriched_at          timestamptz not null default now()
);

alter table public.building_enrichments enable row level security;

-- Public read: the runtime endpoint queries with the anon key.
create policy "building_enrichments_public_read"
  on public.building_enrichments
  for select
  using (true);

-- Writes happen only via the service-role key (backfill script), which bypasses RLS.
-- No write policy is needed.

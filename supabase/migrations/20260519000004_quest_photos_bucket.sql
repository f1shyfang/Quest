-- quest-photos Storage bucket + team-scoped RLS policies on storage.objects.
--
-- Background: app/quest/demo/[huntSlug]/play/play-shell.tsx (~L838) uploads
-- captures as:
--     `${session.id}/${clue.id}-${Date.now()}.jpg`
-- i.e. the first path segment is the originating quest_hunt_sessions.id.
-- This lets SELECT policies map an object back to a session (and via that, to
-- a team) by parsing the first folder of `storage.objects.name`.
--
-- PRD §7.4: photos are visible only to team members of the originating team.

-- =============================================================================
-- Bucket
-- =============================================================================

-- Private bucket — not public. Reads must go through signed URLs or
-- authenticated SELECTs that pass the RLS policies below.
insert into storage.buckets (id, name, public)
values ('quest-photos', 'quest-photos', false)
on conflict (id) do nothing;

-- =============================================================================
-- RLS policies on storage.objects, scoped to bucket_id = 'quest-photos'
-- =============================================================================
-- storage.objects already has RLS enabled by Supabase; we just add policies.

-- INSERT: any authenticated caller can upload to this bucket. App-level checks
-- (the clue-progress flow) gate which sessions/clues a user is actually allowed
-- to write for; the bucket itself simply trusts authenticated users so the
-- happy-path upload from play-shell.tsx works.
drop policy if exists "quest_photos_authed_insert" on storage.objects;
create policy "quest_photos_authed_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'quest-photos');

-- SELECT: only members of the team that owns the originating session can read.
-- The first folder of the object name is the hunt_session_id (see path
-- convention above). We parse it, look up the session's team_id, and defer
-- to quest_is_team_member.
drop policy if exists "quest_photos_team_member_read" on storage.objects;
create policy "quest_photos_team_member_read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'quest-photos'
    and exists (
      select 1
      from public.quest_hunt_sessions s
      where s.id::text = split_part(storage.objects.name, '/', 1)
        and public.quest_is_team_member(s.team_id)
    )
  );

-- UPDATE: only the uploader can modify their own object.
drop policy if exists "quest_photos_owner_update" on storage.objects;
create policy "quest_photos_owner_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'quest-photos' and auth.uid() = owner)
  with check (bucket_id = 'quest-photos' and auth.uid() = owner);

-- DELETE: only the uploader can delete their own object.
drop policy if exists "quest_photos_owner_delete" on storage.objects;
create policy "quest_photos_owner_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'quest-photos' and auth.uid() = owner);

-- =============================================================================
-- 20260520000002_map_view_penalty
--
-- Adds a paid map-view cost mirroring the existing hint penalty: tapping
-- "map" on a clue charges +60s to that team's run, once per clue. Until the
-- player pays, the clue card hides the location name and live distance so
-- the riddle isn't trivially spoilered by the surrounding chrome.
--
-- Backend changes:
--   1. New column quest_clue_progress.maps_used (smallint, 0..1) — set to 1
--      when the player viewed the map for that clue.
--   2. quest_unlock_clue now takes p_maps_used; the per-clue maps_used is
--      max-merged on conflict and rolled into hint_penalty_seconds at
--      unlock time alongside hints_used.
--
-- The column is named hint_penalty_seconds for legacy reasons but represents
-- "total accumulated time penalty in seconds" — keeping the name stable
-- avoids a wider rename across the schema and the play-shell timer.
--
-- Drive-by fix: in the prior RPC the "hunt complete" branch returned before
-- rolling p_hints_used into either hint_penalty_seconds or total_time_seconds,
-- so hints spent on the final clue were never counted. This version folds
-- both the hint and map penalties in for the final clue too.
-- =============================================================================

alter table public.quest_clue_progress
  add column if not exists maps_used smallint not null default 0
    check (maps_used >= 0 and maps_used <= 1);

create or replace function public.quest_unlock_clue(
  p_user_id uuid,
  p_session_id uuid,
  p_clue_id uuid,
  p_manual_override boolean default false,
  p_hints_used integer default 0,
  p_photo_url text default null::text,
  p_maps_used integer default 0
)
returns public.quest_hunt_sessions
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := p_user_id;
  v_session public.quest_hunt_sessions;
  v_clue public.quest_clues;
  v_max_seq int;
  v_next_tier int;
  v_next_seq int;
  v_member_count int;
begin
  if v_user is null then
    raise exception 'p_user_id is required';
  end if;

  select * into v_session from public.quest_hunt_sessions where id = p_session_id;
  if v_session.id is null then
    raise exception 'session not found';
  end if;

  select count(*) into v_member_count
  from public.quest_team_members
  where team_id = v_session.team_id and user_id = v_user;
  if v_member_count = 0 then
    raise exception 'not a member of this team';
  end if;

  if v_session.state <> 'in_progress' then
    raise exception 'session is not in progress';
  end if;

  select * into v_clue from public.quest_clues where id = p_clue_id;
  if v_clue.id is null then
    raise exception 'clue not found';
  end if;

  if v_clue.hunt_id <> v_session.hunt_id
    or v_clue.tier <> v_session.current_tier
    or v_clue.sequence_in_tier <> v_session.current_sequence
  then
    raise exception 'this is not the current clue';
  end if;

  insert into public.quest_clue_progress (
    hunt_session_id, clue_id, hints_used, maps_used, manual_override, photo_capture_url
  )
  values (p_session_id, p_clue_id, p_hints_used, p_maps_used, p_manual_override, p_photo_url)
  on conflict (hunt_session_id, clue_id) do update
    set hints_used = greatest(quest_clue_progress.hints_used, excluded.hints_used),
        maps_used = greatest(quest_clue_progress.maps_used, excluded.maps_used),
        manual_override = quest_clue_progress.manual_override or excluded.manual_override,
        photo_capture_url = coalesce(excluded.photo_capture_url, quest_clue_progress.photo_capture_url);

  select coalesce(max(sequence_in_tier), 0) into v_max_seq
  from public.quest_clues
  where hunt_id = v_session.hunt_id and tier = v_session.current_tier;

  if v_session.current_sequence < v_max_seq then
    v_next_tier := v_session.current_tier;
    v_next_seq := v_session.current_sequence + 1;
  else
    select min(tier) into v_next_tier
    from public.quest_clues
    where hunt_id = v_session.hunt_id and tier > v_session.current_tier;
    if v_next_tier is null then
      update public.quest_hunt_sessions
      set state = 'completed',
          completed_at = now(),
          total_time_seconds = floor(extract(epoch from (now() - started_at)))
            + hint_penalty_seconds
            + (coalesce(p_hints_used, 0) * 60)
            + (coalesce(p_maps_used, 0) * 60),
          hint_penalty_seconds = hint_penalty_seconds
            + (coalesce(p_hints_used, 0) * 60)
            + (coalesce(p_maps_used, 0) * 60)
      where id = p_session_id
      returning * into v_session;
      return v_session;
    end if;
    v_next_seq := 1;
  end if;

  update public.quest_hunt_sessions
  set current_tier = v_next_tier,
      current_sequence = v_next_seq,
      hint_penalty_seconds = hint_penalty_seconds
        + (coalesce(p_hints_used, 0) * 60)
        + (coalesce(p_maps_used, 0) * 60)
  where id = p_session_id
  returning * into v_session;

  return v_session;
end;
$function$;

grant execute on function public.quest_unlock_clue(uuid, uuid, uuid, boolean, integer, text, integer)
  to anon, authenticated;

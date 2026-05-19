-- =============================================================================
-- 20260520000003_immediate_penalty_rpc
--
-- Adds quest_apply_penalty(p_user_id, p_session_id, p_seconds): bumps the
-- session's hint_penalty_seconds immediately so the in-progress timer
-- reflects the cost of a hint or map view the moment the player commits to
-- it, not when the clue is finally unlocked.
--
-- The client now charges via this RPC at hint/map confirm time and passes
-- p_hints_used / p_maps_used = 0 to quest_unlock_clue, so penalties are no
-- longer applied at unlock. The unlock RPC still accepts those parameters
-- for back-compat with any in-flight clients; they become a no-op when
-- callers pass 0.
-- =============================================================================

create or replace function public.quest_apply_penalty(
  p_user_id uuid,
  p_session_id uuid,
  p_seconds integer
)
returns public.quest_hunt_sessions
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := p_user_id;
  v_session public.quest_hunt_sessions;
  v_member_count int;
begin
  if v_user is null then
    raise exception 'p_user_id is required';
  end if;
  if p_seconds is null or p_seconds <= 0 then
    raise exception 'p_seconds must be positive';
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

  update public.quest_hunt_sessions
  set hint_penalty_seconds = hint_penalty_seconds + p_seconds
  where id = p_session_id
  returning * into v_session;

  return v_session;
end;
$function$;

grant execute on function public.quest_apply_penalty(uuid, uuid, integer) to anon, authenticated;

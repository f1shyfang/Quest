-- =============================================================================
-- 20260520000000_fix_quest_ensure_profile_empty_name
--
-- Bug: quest_ensure_profile clobbered an existing display_name back to
-- 'player' when called with p_display_name = '' against a row that already
-- existed. The INSERT side computed coalesce(nullif('',''), 'player') →
-- 'player', so excluded.display_name was 'player' (not ''). The ON CONFLICT
-- UPDATE then evaluated coalesce(nullif('player',''), existing), which is
-- 'player', wiping the existing value.
--
-- The server-side preflight in app/quest/demo/page.tsx calls this RPC with
-- p_display_name = '' on every render to ensure a profile exists, so every
-- page load was resetting the player's chosen name.
--
-- Fix: in the ON CONFLICT UPDATE branch, check p_display_name directly
-- instead of excluded.display_name, so the "empty input means keep existing"
-- semantics actually work.
-- =============================================================================

create or replace function public.quest_ensure_profile(
  p_user_id uuid,
  p_display_name text
)
returns public.quest_profiles
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := p_user_id;
  v_row public.quest_profiles;
begin
  if v_user is null then
    raise exception 'p_user_id is required';
  end if;

  insert into public.quest_profiles (user_id, display_name, unsw_verified)
  values (
    v_user,
    coalesce(nullif(p_display_name, ''), 'player'),
    false
  )
  on conflict (user_id) do update
    set display_name = coalesce(nullif(p_display_name, ''), public.quest_profiles.display_name)
  returning * into v_row;

  return v_row;
end;
$function$;

grant execute on function public.quest_ensure_profile(uuid, text) to anon, authenticated;

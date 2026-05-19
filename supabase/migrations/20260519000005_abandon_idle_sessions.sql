-- Abandon idle hunt sessions after 30 minutes of inactivity (PRD §7.2).
--
-- A session is "idle" when state='in_progress' and the most recent
-- quest_clue_progress.unlocked_at (or started_at, if no clues unlocked yet)
-- is more than 30 minutes in the past.
--
-- We run this purely in-database via pg_cron every 5 minutes — no Edge
-- Function needed. The sweep function is SECURITY DEFINER so it can update
-- quest_hunt_sessions without depending on the cron job's role/RLS.

-- =============================================================================
-- Extensions
-- =============================================================================

create extension if not exists pg_cron;

-- =============================================================================
-- Schema additions
-- =============================================================================

-- Record when a session was marked abandoned, so we can distinguish that
-- moment from started_at / completed_at for analytics and debugging.
alter table public.quest_hunt_sessions
  add column if not exists abandoned_at timestamptz;

-- =============================================================================
-- Sweep function
-- =============================================================================

create or replace function public.quest_abandon_idle_sessions()
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_threshold constant interval := interval '30 minutes';
  v_count integer;
begin
  with last_activity as (
    select
      s.id as session_id,
      coalesce(
        (select max(p.unlocked_at)
           from public.quest_clue_progress p
          where p.hunt_session_id = s.id),
        s.started_at
      ) as last_active_at
    from public.quest_hunt_sessions s
    where s.state = 'in_progress'
  ),
  to_abandon as (
    select session_id
    from last_activity
    where last_active_at is not null
      and last_active_at < (now() - v_threshold)
  ),
  updated as (
    update public.quest_hunt_sessions s
       set state = 'abandoned',
           abandoned_at = now()
      from to_abandon a
     where s.id = a.session_id
       and s.state = 'in_progress'
    returning s.id
  )
  select count(*) into v_count from updated;

  return v_count;
end;
$function$;

-- Lock down execution: only the table owner / service_role should be able to
-- run the sweep. (pg_cron runs as the database superuser / postgres role on
-- Supabase, which bypasses these grants anyway.)
revoke all on function public.quest_abandon_idle_sessions() from public;
revoke all on function public.quest_abandon_idle_sessions() from anon, authenticated;

-- =============================================================================
-- Cron schedule (every 5 minutes)
-- =============================================================================

-- Unschedule any previous version so this migration is rerunnable. cron.unschedule
-- raises if the job name doesn't exist, so we swallow the error in a DO block.
do $$
begin
  perform cron.unschedule('quest-abandon-idle-sessions');
exception
  when others then null;
end
$$;

select cron.schedule(
  'quest-abandon-idle-sessions',
  '*/5 * * * *',
  $$ select public.quest_abandon_idle_sessions(); $$
);

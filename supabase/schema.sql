-- The Tea Party: anonymous daily line. Run in the Supabase SQL editor (fresh projects), or run
-- supabase/migrations/2026-10-20-anonymous-line.sql first if you used the earlier account-based version.
-- Then schedule the daily archive with supabase/cron.sql.
--
-- Model: guests are anonymous. The server keeps a random token in an HttpOnly cookie and stores only its
-- SHA-256 hash here (guest_key). Every table has row-level security and no policies, so the anon and
-- authenticated database roles cannot read or write anything; only the server (service role) calls the
-- functions below. Timestamps are UTC; the business day is computed in app_settings.business_timezone.

create table if not exists public.app_settings (
  key text primary key,
  value text not null
);
insert into public.app_settings (key, value) values
  ('business_timezone', 'Europe/Riga'),
  ('line_capacity', '500')
on conflict (key) do nothing;

create table if not exists public.queue_entries (
  id bigint generated always as identity primary key,
  guest_key text not null check (guest_key ~ '^[0-9a-f]{64}$'),
  display_name text not null check (char_length(display_name) between 2 and 24),
  business_date date not null,
  joined_at timestamptz not null default now(),
  unique (guest_key, business_date) -- one place per guest per day; also makes repeat submits harmless
);
create index if not exists queue_entries_order on public.queue_entries (business_date, joined_at, id);

create table if not exists public.daily_archive (
  business_date date not null,
  position smallint not null check (position between 1 and 5),
  display_name text not null,
  joined_at timestamptz not null,
  archived_at timestamptz not null default now(),
  primary key (business_date, position) -- a retried archive can never duplicate a place
);

alter table public.app_settings enable row level security;
alter table public.queue_entries enable row level security;
alter table public.daily_archive enable row level security;

create or replace function public.business_today(p_at timestamptz default now()) returns date
language sql stable set search_path = public as $$
  select (p_at at time zone coalesce((select value from public.app_settings where key = 'business_timezone'), 'Europe/Riga'))::date;
$$;

-- Archive each finished day's first five and clear it. Runs in one transaction; a lock serialises
-- concurrent runs (the scheduled job and request-time checks), and the archive's primary key makes
-- a retry a no-op, so results are never erased or duplicated.
create or replace function public.rollover_queue(p_at timestamptz default now()) returns integer
language plpgsql set search_path = public as $$
declare
  v_today date := public.business_today(p_at);
  v_day date;
  v_closed integer := 0;
begin
  perform pg_advisory_xact_lock(hashtext('tea-queue-rollover'));
  for v_day in select distinct business_date from public.queue_entries where business_date < v_today order by 1 loop
    insert into public.daily_archive (business_date, position, display_name, joined_at)
    select v_day, row_number() over (order by joined_at, id), display_name, joined_at
    from (select display_name, joined_at, id from public.queue_entries where business_date = v_day order by joined_at, id limit 5) as first_five
    on conflict (business_date, position) do nothing;
    delete from public.queue_entries where business_date = v_day;
    v_closed := v_closed + 1;
  end loop;
  return v_closed;
end;
$$;

create or replace function public.queue_snapshot(p_guest_key text, p_at timestamptz default now()) returns jsonb
language plpgsql set search_path = public as $$
declare
  v_today date;
begin
  perform public.rollover_queue(p_at);
  v_today := public.business_today(p_at);
  return (
    with line as (
      select row_number() over (order by joined_at, id) as position, display_name, joined_at, guest_key = p_guest_key as mine
      from public.queue_entries where business_date = v_today
    )
    select jsonb_build_object(
      'date', v_today,
      'total', (select count(*) from line),
      'me', (select position from line where mine),
      'entries', coalesce((select jsonb_agg(jsonb_build_object('position', position, 'name', display_name, 'joinedAt', joined_at, 'mine', mine) order by position) from line), '[]'::jsonb)
    )
  );
end;
$$;

create or replace function public.join_queue(p_guest_key text, p_name text, p_at timestamptz default now()) returns jsonb
language plpgsql set search_path = public as $$
declare
  v_today date;
  v_inserted integer;
  v_capacity integer := coalesce((select value::integer from public.app_settings where key = 'line_capacity'), 500);
  v_position integer;
  v_total integer;
begin
  perform public.rollover_queue(p_at);
  v_today := public.business_today(p_at);
  if not exists (select 1 from public.queue_entries where guest_key = p_guest_key and business_date = v_today)
     and (select count(*) from public.queue_entries where business_date = v_today) >= v_capacity then
    raise exception 'line_full';
  end if;
  insert into public.queue_entries (guest_key, display_name, business_date, joined_at)
  values (p_guest_key, p_name, v_today, p_at)
  on conflict (guest_key, business_date) do nothing;
  get diagnostics v_inserted = row_count;
  select position, total into v_position, v_total from (
    select guest_key, row_number() over (order by joined_at, id) as position, count(*) over () as total
    from public.queue_entries where business_date = v_today
  ) as line where guest_key = p_guest_key;
  return jsonb_build_object('position', v_position, 'total', v_total, 'joined', v_inserted = 1);
end;
$$;

-- Removes only the caller's own entry: the key comes from the caller's own cookie, never from the request body.
create or replace function public.leave_queue(p_guest_key text, p_at timestamptz default now()) returns boolean
language plpgsql set search_path = public as $$
declare
  v_deleted integer;
begin
  perform public.rollover_queue(p_at);
  delete from public.queue_entries where guest_key = p_guest_key and business_date = public.business_today(p_at);
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

-- The first five of the most recently completed business day (yesterday). Empty if nobody joined.
create or replace function public.archive_latest(p_at timestamptz default now()) returns jsonb
language plpgsql set search_path = public as $$
declare
  v_day date;
begin
  perform public.rollover_queue(p_at);
  v_day := public.business_today(p_at) - 1;
  return jsonb_build_object(
    'date', v_day,
    'entries', coalesce((select jsonb_agg(jsonb_build_object('position', position, 'name', display_name, 'joinedAt', joined_at) order by position)
                         from public.daily_archive where business_date = v_day), '[]'::jsonb)
  );
end;
$$;

-- Only the server's service role may call these. (Guarded so the file also runs outside Supabase, e.g. in tests.)
do $$
declare
  f text;
begin
  foreach f in array array['business_today(timestamptz)', 'rollover_queue(timestamptz)', 'queue_snapshot(text, timestamptz)', 'join_queue(text, text, timestamptz)', 'leave_queue(text, timestamptz)', 'archive_latest(timestamptz)'] loop
    execute format('revoke all on function public.%s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on function public.%s from anon, authenticated', f); end if;
    if exists (select 1 from pg_roles where rolname = 'service_role') then execute format('grant execute on function public.%s to service_role', f); end if;
  end loop;
end;
$$;

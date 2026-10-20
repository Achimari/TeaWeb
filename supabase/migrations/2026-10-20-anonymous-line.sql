-- Migration from the earlier account-based line (profiles + queue_entries keyed by auth.users) to the
-- anonymous line. Accounts cannot be mapped to anonymous browser cookies, so the old line and nicknames
-- are dropped. Run this once, then run supabase/schema.sql, then supabase/cron.sql.
-- Review before running: this permanently deletes the old tables' rows.
begin;
drop table if exists public.queue_entries cascade;
drop table if exists public.profiles cascade;
commit;
-- The Supabase Auth users created by the old version (emails ending in @tea-party.invalid) are no longer used.
-- Remove them from Authentication → Users in the dashboard if you want them gone.

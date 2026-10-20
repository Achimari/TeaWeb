-- Daily archive-and-reset for the line, scheduled in the database itself.
-- Supabase: enable the pg_cron extension (Database → Extensions), then run this file.
--
-- It runs hourly, five minutes past the hour, rather than once at a fixed UTC time: Riga midnight is
-- 21:00 or 22:00 UTC depending on daylight-saving time, and rollover_queue() is idempotent, so the extra
-- runs do nothing. Every queue read and write also calls rollover_queue() first, in case a run is missed.
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'tea-queue-rollover';
select cron.schedule('tea-queue-rollover', '5 * * * *', $$select public.rollover_queue()$$);

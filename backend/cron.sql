-- ============================================================
-- FTL GYM — Schedule Daily Review Sync
-- Requires pg_cron extension (enabled by default on Supabase)
-- Runs every day at 3:00 AM WIB (20:00 UTC previous day)
-- ============================================================

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the Edge Function to run daily at 3 AM WIB (UTC+7)
-- Supabase Edge Functions can be triggered via pg_net
SELECT cron.schedule(
  'daily-ftl-review-sync',          -- job name
  '0 20 * * *',                      -- cron expression: 20:00 UTC = 03:00 WIB
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/pull-ftl-reviews',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To check scheduled jobs:
-- SELECT * FROM cron.job;

-- To remove the schedule:
-- SELECT cron.unschedule('daily-ftl-review-sync');

-- To check run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- ============================================================
-- FTL GYM — Branch photos (Google Places Photos API)
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================
-- Adds columns for a cached photo URL per branch, pulled from
-- the Google Places API New (places.googleapis.com).
-- The photo_uri is a lh3.googleusercontent.com URL that can be
-- loaded directly by the browser without exposing the API key.
-- ============================================================

ALTER TABLE ftl_branches
  ADD COLUMN IF NOT EXISTS photo_uri TEXT,
  ADD COLUMN IF NOT EXISTS photo_attribution TEXT,
  ADD COLUMN IF NOT EXISTS photo_synced_at TIMESTAMPTZ;

-- Recreate the branch summary view to expose photo_uri
CREATE OR REPLACE VIEW ftl_branch_summary AS
SELECT
  b.id,
  b.branch_name,
  b.branch_code,
  b.region,
  b.city,
  b.google_rating,
  b.total_reviews,
  b.google_place_id,
  b.latitude,
  b.longitude,
  b.photo_uri,
  b.photo_attribution,
  b.photo_synced_at,
  b.last_synced_at,
  COUNT(r.id) AS stored_reviews,
  COUNT(r.id) FILTER (WHERE r.rating <= 2) AS negative_reviews,
  COUNT(r.id) FILTER (WHERE r.rating = 3) AS neutral_reviews,
  COUNT(r.id) FILTER (WHERE r.rating >= 4) AS positive_reviews,
  ROUND(AVG(r.rating)::NUMERIC, 2) AS avg_stored_rating
FROM ftl_branches b
LEFT JOIN ftl_reviews r ON r.branch_id = b.id
WHERE b.is_active = TRUE
GROUP BY b.id;

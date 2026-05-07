-- ============================================================
-- FTL GYM — Google Maps Review Dashboard Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. BRANCHES TABLE
-- Stores all FTL gym locations with Google Place IDs
-- ============================================================
CREATE TABLE IF NOT EXISTS ftl_branches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Branch identity
  branch_name TEXT NOT NULL,             -- e.g. "FTL GYM Cibubur"
  branch_code TEXT UNIQUE,               -- e.g. "CBR" (internal code)
  region TEXT,                           -- e.g. "Jabodetabek", "Bali", "Surabaya"
  city TEXT,                             -- e.g. "Jakarta Timur"
  
  -- Google Maps data
  google_place_id TEXT NOT NULL UNIQUE,  -- Google Place ID
  formatted_address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  
  -- Aggregated review data (updated by Edge Function)
  google_rating NUMERIC(2,1),            -- e.g. 4.5
  total_reviews INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  
  -- Meta
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. REVIEWS TABLE
-- Stores individual Google reviews for each branch
-- ============================================================
CREATE TABLE IF NOT EXISTS ftl_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Foreign key to branch
  branch_id UUID NOT NULL REFERENCES ftl_branches(id) ON DELETE CASCADE,
  
  -- Review data from Google
  google_review_id TEXT,                 -- Unique identifier (author + time hash)
  author_name TEXT NOT NULL,
  author_photo_url TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  language TEXT,                         -- e.g. "id", "en"
  relative_time TEXT,                    -- e.g. "2 weeks ago"
  review_time BIGINT,                    -- Unix timestamp from Google
  
  -- Internal tracking
  is_responded BOOLEAN DEFAULT FALSE,    -- Has FTL replied?
  response_text TEXT,                    -- Owner's response if any
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  flagged BOOLEAN DEFAULT FALSE,         -- Flag for attention
  notes TEXT,                            -- Internal notes
  
  -- Meta
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate reviews
  UNIQUE(branch_id, google_review_id)
);

-- ============================================================
-- 3. SYNC LOG TABLE
-- Tracks each sync run for debugging
-- ============================================================
CREATE TABLE IF NOT EXISTS ftl_review_sync_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  branches_processed INTEGER DEFAULT 0,
  new_reviews_found INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed'))
);

-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX idx_reviews_branch_id ON ftl_reviews(branch_id);
CREATE INDEX idx_reviews_rating ON ftl_reviews(rating);
CREATE INDEX idx_reviews_review_time ON ftl_reviews(review_time DESC);
CREATE INDEX idx_reviews_sentiment ON ftl_reviews(sentiment);
CREATE INDEX idx_branches_region ON ftl_branches(region);
CREATE INDEX idx_branches_active ON ftl_branches(is_active);

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE ftl_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ftl_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ftl_review_sync_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read on branches" 
  ON ftl_branches FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated read on reviews" 
  ON ftl_reviews FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated read on sync_log" 
  ON ftl_review_sync_log FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow service role full access (for Edge Functions)
CREATE POLICY "Service role full access branches" 
  ON ftl_branches FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Service role full access reviews" 
  ON ftl_reviews FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Service role full access sync_log" 
  ON ftl_review_sync_log FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- ============================================================
-- 6. HELPER VIEWS
-- ============================================================

-- Branch summary with review stats
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

-- Recent negative reviews (for alerts)
CREATE OR REPLACE VIEW ftl_negative_alerts AS
SELECT 
  r.*,
  b.branch_name,
  b.branch_code,
  b.region
FROM ftl_reviews r
JOIN ftl_branches b ON b.id = r.branch_id
WHERE r.rating <= 2
ORDER BY r.review_time DESC
LIMIT 50;

-- ============================================================
-- 7. UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON ftl_branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

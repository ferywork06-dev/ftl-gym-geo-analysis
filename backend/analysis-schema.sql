-- ============================================================
-- FTL Reviews — Analysis layer (Gemini-powered)
-- Run this AFTER schema.sql in the Supabase SQL Editor.
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE).
-- ============================================================

-- ------------------------------------------------------------
-- 1. PER-REVIEW ANALYSIS
-- One row per review. Populated by the /api/analyze route,
-- which calls Gemini 2.5 Flash and writes the structured output.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ftl_review_analysis (
  review_id UUID PRIMARY KEY REFERENCES ftl_reviews(id) ON DELETE CASCADE,

  -- Structured extraction
  themes TEXT[] DEFAULT '{}',           -- e.g. ["AC tidak dingin", "Staff tidak ramah"]
  keywords TEXT[] DEFAULT '{}',         -- e.g. ["AC", "staff", "kotor"]
  is_complaint BOOLEAN DEFAULT FALSE,
  sentiment_score NUMERIC(3,2),         -- -1.00 .. 1.00

  -- Drafted owner reply (Bahasa Indonesia, FTL brand voice)
  suggested_reply TEXT,
  reply_language TEXT,                  -- "id" | "en"

  -- Meta
  model TEXT,                           -- e.g. "gemini-2.5-flash"
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_analysis_is_complaint ON ftl_review_analysis(is_complaint);
CREATE INDEX IF NOT EXISTS idx_review_analysis_themes ON ftl_review_analysis USING GIN (themes);
CREATE INDEX IF NOT EXISTS idx_review_analysis_keywords ON ftl_review_analysis USING GIN (keywords);

ALTER TABLE ftl_review_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read on analysis" ON ftl_review_analysis;
CREATE POLICY "Allow authenticated read on analysis"
  ON ftl_review_analysis FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Service role full access analysis" ON ftl_review_analysis;
CREATE POLICY "Service role full access analysis"
  ON ftl_review_analysis FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- 2. AGGREGATE VIEWS
-- ------------------------------------------------------------

-- Top complaint themes across all analyzed reviews.
-- Unnests the themes array so each theme becomes a row.
CREATE OR REPLACE VIEW ftl_top_complaints AS
SELECT
  theme,
  COUNT(*)::INTEGER AS mentions,
  COUNT(DISTINCT r.branch_id)::INTEGER AS branches_affected,
  MAX(r.review_time) AS last_seen
FROM ftl_review_analysis a
JOIN ftl_reviews r ON r.id = a.review_id
CROSS JOIN LATERAL UNNEST(a.themes) AS theme
WHERE a.is_complaint = TRUE
  AND theme IS NOT NULL
  AND length(trim(theme)) > 0
GROUP BY theme
ORDER BY mentions DESC;

-- Top keywords (same shape, keyed on keywords array).
CREATE OR REPLACE VIEW ftl_top_keywords AS
SELECT
  keyword,
  COUNT(*)::INTEGER AS mentions,
  COUNT(DISTINCT r.branch_id)::INTEGER AS branches_affected
FROM ftl_review_analysis a
JOIN ftl_reviews r ON r.id = a.review_id
CROSS JOIN LATERAL UNNEST(a.keywords) AS keyword
WHERE a.is_complaint = TRUE
  AND keyword IS NOT NULL
  AND length(trim(keyword)) > 0
GROUP BY keyword
ORDER BY mentions DESC;

-- Branch complaint spike detector.
-- Compares complaints in the last 7 days vs. the weekly average
-- over the prior 30 days. A branch "spikes" when recent count
-- is >= 2 AND >= 2x the baseline.
CREATE OR REPLACE VIEW ftl_branch_complaint_spikes AS
WITH windowed AS (
  SELECT
    r.branch_id,
    COUNT(*) FILTER (
      WHERE r.review_time >= EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days')
    )::INTEGER AS recent_7d,
    COUNT(*) FILTER (
      WHERE r.review_time >= EXTRACT(EPOCH FROM NOW() - INTERVAL '37 days')
        AND r.review_time <  EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days')
    )::INTEGER AS prior_30d
  FROM ftl_reviews r
  JOIN ftl_review_analysis a ON a.review_id = r.id
  WHERE a.is_complaint = TRUE
  GROUP BY r.branch_id
)
SELECT
  w.branch_id,
  b.branch_name,
  b.branch_code,
  b.region,
  w.recent_7d,
  w.prior_30d,
  ROUND((w.prior_30d::NUMERIC / 30.0) * 7.0, 2) AS baseline_weekly,
  CASE
    WHEN w.recent_7d >= 2
     AND w.recent_7d >= 2 * GREATEST((w.prior_30d::NUMERIC / 30.0) * 7.0, 1)
    THEN TRUE
    ELSE FALSE
  END AS is_spiking
FROM windowed w
JOIN ftl_branches b ON b.id = w.branch_id
ORDER BY is_spiking DESC, w.recent_7d DESC;

-- ------------------------------------------------------------
-- 3. HELPER: reviews that still need analysis
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW ftl_reviews_pending_analysis AS
SELECT r.*
FROM ftl_reviews r
LEFT JOIN ftl_review_analysis a ON a.review_id = r.id
WHERE a.review_id IS NULL
  AND r.review_text IS NOT NULL
  AND length(trim(r.review_text)) > 0
ORDER BY r.review_time DESC;

-- ============================================================
-- FTL GYM — Seed Branch Data
-- Replace the placeholder Place IDs with real ones.
--
-- HOW TO FIND PLACE IDS:
-- 1. Go to https://developers.google.com/maps/documentation/places/web-service/place-id
-- 2. Search "FTL GYM [branch name]"
-- 3. Copy the Place ID
--
-- Or use the Google Maps JavaScript API:
-- const service = new google.maps.places.PlacesService(map);
-- service.findPlaceFromQuery({ query: "FTL GYM Cibubur", fields: ["place_id"] }, callback);
-- ============================================================

INSERT INTO ftl_branches (branch_name, branch_code, region, city, google_place_id, latitude, longitude)
VALUES
  -- JABODETABEK
  ('FTL GYM Cibubur',          'CBR',  'Jabodetabek', 'Jakarta Timur',    'REPLACE_WITH_PLACE_ID', -6.3700, 106.8800),
  ('FTL GYM Kelapa Gading',    'KPG',  'Jabodetabek', 'Jakarta Utara',    'REPLACE_WITH_PLACE_ID', -6.1580, 106.9050),
  ('FTL GYM PIK',              'PIK',  'Jabodetabek', 'Jakarta Utara',    'REPLACE_WITH_PLACE_ID', -6.1100, 106.7400),
  ('FTL GYM BSD',              'BSD',  'Jabodetabek', 'Tangerang Selatan', 'REPLACE_WITH_PLACE_ID', -6.3020, 106.6530),
  ('FTL GYM Bekasi',           'BKS',  'Jabodetabek', 'Bekasi',           'REPLACE_WITH_PLACE_ID', -6.2383, 106.9756),
  ('FTL GYM Depok',            'DPK',  'Jabodetabek', 'Depok',            'REPLACE_WITH_PLACE_ID', -6.4025, 106.7942),
  
  -- BALI
  ('FTL GYM Bali Kuta',        'BLK',  'Bali',        'Badung',           'REPLACE_WITH_PLACE_ID', -8.7180, 115.1710),
  ('FTL GYM Bali Seminyak',    'BLS',  'Bali',        'Badung',           'REPLACE_WITH_PLACE_ID', -8.6900, 115.1600),
  
  -- SURABAYA
  ('FTL GYM Surabaya',         'SBY',  'Surabaya',    'Surabaya',         'REPLACE_WITH_PLACE_ID', -7.2575, 112.7521),
  
  -- BANDUNG
  ('FTL GYM Bandung',          'BDG',  'Bandung',     'Bandung',          'REPLACE_WITH_PLACE_ID', -6.9175, 107.6191)

  -- ADD MORE BRANCHES BELOW...
  -- Copy the pattern above for all 60+ locations
ON CONFLICT (google_place_id) DO NOTHING;

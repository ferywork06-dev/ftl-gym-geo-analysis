-- STRIDE Gym branches — 5 locations
-- Generated: 2026-04-20
-- Source: Google Maps short URLs provided by user, resolved via Google Places API

INSERT INTO ftl_branches (branch_name, branch_code, region, city, google_place_id, formatted_address, latitude, longitude, is_active)
VALUES
  ('STRIDE Gym Latumenten',   'S-LAT', 'Jabodetabek', 'Jakarta Barat',  'ChIJp8Yhzr33aS4Rv28bGbLohlU', 'Jl. Prof. Dr. Latumeten, RW.6, Angke, Kec. Tambora, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11330, Indonesia', -6.1479244, 106.7943962, true),
  ('STRIDE Gym Pecenongan',   'S-PEC', 'Jabodetabek', 'Jakarta Pusat',  'ChIJc2l4K_P1aS4RbzwvTp4XSTk', 'Jl. Batu Tulis Raya No.31 dan 33, Kb. Klp., Kecamatan Gambir, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10120, Indonesia', -6.1631326, 106.8244098, true),
  ('STRIDE Gym Cibinong',     'S-CIB', 'Bogor',       'Bogor',          'ChIJqxOmKjvBaS4Rs16OpN5jLPY', 'Jl. Raya Jakarta-Bogor No.KM 45, Pakansari, Kec. Cibinong, Kabupaten Bogor, Jawa Barat 16915, Indonesia', -6.4882814, 106.8433255, true),
  ('STRIDE Gym Gading Timur', 'S-GT',  'Jabodetabek', 'Jakarta Utara',  'ChIJU7bdPJOLaS4ReqE_kAQNZnw', 'Jl. Arteri Klp. Gading No.65, Pegangsaan Dua, Kec. Klp. Gading, Jakarta Utara, Daerah Khusus Ibukota Jakarta 14240, Indonesia', -6.1699388, 106.9155704, true),
  ('STRIDE Gym Banceuy',      'S-BAN', 'Bandung',     'Bandung',        'ChIJg2nDpWvnaC4Rj8VZ7O6--pc', 'Jl. Banceuy Desa No.70, Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40111, Indonesia', -6.9170439, 107.6062944, true)
ON CONFLICT (google_place_id) DO UPDATE SET
  branch_name = EXCLUDED.branch_name,
  formatted_address = EXCLUDED.formatted_address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;

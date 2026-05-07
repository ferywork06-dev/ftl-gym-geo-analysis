create table if not exists ftl_geo_cache (
  id uuid primary key default gen_random_uuid(),
  branch_code text not null,
  radius integer not null,
  places jsonb not null,
  cached_at timestamptz not null default now(),
  unique (branch_code, radius)
);

-- Auto-expire: index for cleanup queries
create index if not exists ftl_geo_cache_cached_at on ftl_geo_cache (cached_at);

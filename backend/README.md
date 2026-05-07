# FTL GYM — Google Maps Review Dashboard (Backend)

## Architecture Overview

```
Google Places API → Supabase Edge Function (daily cron) → Supabase DB
                                                              ↓
                                                     Next.js Dashboard
```

## Setup Steps

### 1. Create Supabase Tables
Run `schema.sql` in your Supabase SQL Editor.

### 2. Add your Google API Key
In Supabase Dashboard → Settings → Edge Functions → Secrets:
```
GOOGLE_PLACES_API_KEY=your_key_here
```

### 3. Deploy the Edge Function
```bash
supabase functions deploy pull-ftl-reviews
```

### 4. Set up the Cron Job
Run `cron.sql` in the SQL Editor to schedule daily pulls.

### 5. Seed Branch Data
Run `seed_branches.sql` — update with your real Place IDs.
To find Place IDs: https://developers.google.com/maps/documentation/places/web-service/place-id

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | Database tables + indexes + RLS policies |
| `seed_branches.sql` | Insert your 60+ FTL branches |
| `cron.sql` | Schedule the daily review pull |
| `supabase/functions/pull-ftl-reviews/index.ts` | Edge Function that hits Google Places API |

## Cost Estimate
- 60 branches × 1 call/day × 30 days = 1,800 calls/month
- Google Places API: ~$17/1K calls = ~$30/month
- Supabase Free Tier covers the DB + Edge Functions

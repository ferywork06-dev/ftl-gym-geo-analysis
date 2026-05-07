// ============================================================
// FTL GYM — Pull Google Reviews Edge Function
// Deploy: supabase functions deploy pull-ftl-reviews
// Secret: GOOGLE_PLACES_API_KEY (set in Supabase Dashboard)
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Types ──────────────────────────────────────────────────

interface GoogleReview {
  author_name: string;
  author_url?: string;
  language?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number; // Unix timestamp
}

interface PlaceDetailsResult {
  name: string;
  rating?: number;
  user_ratings_total?: number;
  reviews?: GoogleReview[];
}

// ── Google Places API ──────────────────────────────────────

async function fetchPlaceDetails(placeId: string): Promise<PlaceDetailsResult | null> {
  const fields = "name,rating,user_ratings_total,reviews";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}&language=id&reviews_sort=newest&reviews_no_translations=true`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK") {
      console.error(`Google API error for ${placeId}: ${data.status} — ${data.error_message || ""}`);
      return null;
    }

    return data.result as PlaceDetailsResult;
  } catch (err) {
    console.error(`Fetch error for ${placeId}:`, err);
    return null;
  }
}

// ── Generate a stable review ID ────────────────────────────

function makeReviewId(authorName: string, time: number): string {
  // Google doesn't give review IDs, so we hash author+time
  const raw = `${authorName}::${time}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `grev_${Math.abs(hash).toString(36)}`;
}

// ── Classify sentiment ─────────────────────────────────────

function classifySentiment(rating: number): "positive" | "neutral" | "negative" {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}

// ── Main handler ───────────────────────────────────────────

serve(async (req: Request) => {
  try {
    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from("ftl_review_sync_log")
      .insert({ status: "running" })
      .select("id")
      .single();

    if (logError) {
      console.error("Failed to create sync log:", logError);
    }

    const syncLogId = syncLog?.id;

    // Fetch all active branches
    const { data: branches, error: branchError } = await supabase
      .from("ftl_branches")
      .select("id, branch_name, google_place_id")
      .eq("is_active", true);

    if (branchError || !branches) {
      throw new Error(`Failed to fetch branches: ${branchError?.message}`);
    }

    let branchesProcessed = 0;
    let newReviewsFound = 0;
    const errors: { branch: string; error: string }[] = [];

    // Process each branch with a small delay to avoid rate limits
    for (const branch of branches) {
      try {
        const details = await fetchPlaceDetails(branch.google_place_id);

        if (!details) {
          errors.push({ branch: branch.branch_name, error: "API returned null" });
          continue;
        }

        // Update branch rating data
        await supabase
          .from("ftl_branches")
          .update({
            google_rating: details.rating || null,
            total_reviews: details.user_ratings_total || 0,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", branch.id);

        // Upsert reviews
        if (details.reviews && details.reviews.length > 0) {
          const reviewRows = details.reviews.map((r) => ({
            branch_id: branch.id,
            google_review_id: makeReviewId(r.author_name, r.time),
            author_name: r.author_name,
            author_photo_url: r.profile_photo_url || null,
            rating: r.rating,
            review_text: r.text || null,
            language: r.language || null,
            relative_time: r.relative_time_description,
            review_time: r.time,
            sentiment: classifySentiment(r.rating),
          }));

          const { data: upserted, error: upsertError } = await supabase
            .from("ftl_reviews")
            .upsert(reviewRows, {
              onConflict: "branch_id,google_review_id",
              ignoreDuplicates: true,
            })
            .select("id");

          if (upsertError) {
            errors.push({ branch: branch.branch_name, error: upsertError.message });
          } else {
            newReviewsFound += upserted?.length || 0;
          }
        }

        branchesProcessed++;

        // Rate limit: 100ms pause between branches
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        errors.push({
          branch: branch.branch_name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Update sync log
    if (syncLogId) {
      await supabase
        .from("ftl_review_sync_log")
        .update({
          finished_at: new Date().toISOString(),
          branches_processed: branchesProcessed,
          new_reviews_found: newReviewsFound,
          errors: errors.length > 0 ? errors : [],
          status: errors.length > 0 ? "completed" : "completed",
        })
        .eq("id", syncLogId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        branches_processed: branchesProcessed,
        new_reviews_found: newReviewsFound,
        errors_count: errors.length,
        errors: errors.slice(0, 10), // Return first 10 errors max
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Fatal error:", err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

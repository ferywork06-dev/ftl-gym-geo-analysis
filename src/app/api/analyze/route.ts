import { NextResponse } from "next/server";
import { getAdminClient, hasAdminCredentials } from "@/lib/supabase-admin";
import { analyzeReview, geminiConfigured, geminiModel } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PendingReview = {
  id: string;
  branch_id: string;
  author_name: string;
  rating: number;
  review_text: string;
};

export async function POST(req: Request) {
  if (!geminiConfigured()) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not set" }, { status: 500 });
  }

  const body = (await req.json().catch(() => ({}))) as { limit?: number; reviewIds?: string[] };
  const limit = Math.min(Math.max(body.limit ?? 25, 1), 100);
  const supabase = getAdminClient();

  let query = supabase
    .from("ftl_reviews_pending_analysis")
    .select("id, branch_id, author_name, rating, review_text")
    .limit(limit);
  if (body.reviewIds?.length) query = query.in("id", body.reviewIds);

  const { data: pending, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!pending || pending.length === 0) {
    return NextResponse.json({ processed: 0, errors: [], message: "No reviews pending analysis." });
  }

  const branchIds = Array.from(new Set((pending as PendingReview[]).map((r) => r.branch_id)));
  const { data: branchRows } = await supabase
    .from("ftl_branches")
    .select("id, branch_name")
    .in("id", branchIds);
  const branchNameById = new Map<string, string>(
    (branchRows ?? []).map((b) => [b.id as string, b.branch_name as string]),
  );

  const errors: Array<{ review_id: string; message: string }> = [];
  let processed = 0;

  for (const row of pending as PendingReview[]) {
    try {
      const result = await analyzeReview({
        review_text: row.review_text,
        rating: row.rating,
        author_name: row.author_name,
        branch_name: branchNameById.get(row.branch_id) ?? "FTL GYM",
      });

      const { error: upsertError } = await supabase.from("ftl_review_analysis").upsert(
        {
          review_id: row.id,
          themes: result.themes,
          keywords: result.keywords,
          is_complaint: result.is_complaint,
          sentiment_score: result.sentiment_score,
          suggested_reply: result.suggested_reply,
          reply_language: result.reply_language,
          model: geminiModel(),
          analyzed_at: new Date().toISOString(),
        },
        { onConflict: "review_id" },
      );

      if (upsertError) {
        errors.push({ review_id: row.id, message: upsertError.message });
      } else {
        processed += 1;
      }

      // light rate-limit: ~15 req/s ceiling for Flash free tier
      await sleep(200);
    } catch (e) {
      errors.push({ review_id: row.id, message: (e as Error).message });
    }
  }

  const { count: remaining } = await supabase
    .from("ftl_reviews_pending_analysis")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({ processed, errors, remaining: remaining ?? 0 });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

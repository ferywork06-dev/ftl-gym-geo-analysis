import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  BranchComplaintSpike,
  BranchSummary,
  ComplaintKeyword,
  ComplaintTheme,
  ReviewAnalysis,
  ReviewWithBranch,
  SyncLog,
} from "./types";
import { mockBranches, mockReviews, mockSyncLogs } from "./mock";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON) {
  client = createClient(SUPABASE_URL, SUPABASE_ANON);
}

export const isMockMode = () => client === null;

export async function getBranches(): Promise<BranchSummary[]> {
  if (!client) return mockBranches;
  const { data, error } = await client
    .from("ftl_branch_summary")
    .select("*")
    .order("branch_name");
  if (error) throw new Error(error.message);
  return (data ?? []) as BranchSummary[];
}

export async function getBranchById(id: string): Promise<BranchSummary | null> {
  if (!client) return mockBranches.find((b) => b.id === id) ?? null;
  const { data, error } = await client
    .from("ftl_branch_summary")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as BranchSummary) ?? null;
}

export async function getReviews(opts?: {
  branchId?: string;
  sentiment?: "positive" | "neutral" | "negative";
  minRating?: number;
  maxRating?: number;
  flaggedOnly?: boolean;
  limit?: number;
}): Promise<ReviewWithBranch[]> {
  const limit = opts?.limit ?? 100;

  if (!client) {
    let rows = mockReviews.slice();
    if (opts?.branchId) rows = rows.filter((r) => r.branch_id === opts.branchId);
    if (opts?.sentiment) rows = rows.filter((r) => r.sentiment === opts.sentiment);
    if (opts?.minRating !== undefined) rows = rows.filter((r) => r.rating >= opts.minRating!);
    if (opts?.maxRating !== undefined) rows = rows.filter((r) => r.rating <= opts.maxRating!);
    if (opts?.flaggedOnly) rows = rows.filter((r) => r.flagged);
    rows.sort((a, b) => (b.review_time ?? 0) - (a.review_time ?? 0));
    return rows.slice(0, limit);
  }

  const selectWithAnalysis =
    "*, ftl_branches!inner(branch_name, branch_code, region, google_place_id), ftl_review_analysis(review_id, themes, keywords, is_complaint, sentiment_score, suggested_reply, reply_language, model, analyzed_at)";
  const selectWithoutAnalysis =
    "*, ftl_branches!inner(branch_name, branch_code, region, google_place_id)";

  const buildQuery = (select: string) => {
    let q = client!
      .from("ftl_reviews")
      .select(select)
      .order("review_time", { ascending: false })
      .limit(limit);
    if (opts?.branchId) q = q.eq("branch_id", opts.branchId);
    if (opts?.sentiment) q = q.eq("sentiment", opts.sentiment);
    if (opts?.minRating !== undefined) q = q.gte("rating", opts.minRating);
    if (opts?.maxRating !== undefined) q = q.lte("rating", opts.maxRating);
    if (opts?.flaggedOnly) q = q.eq("flagged", true);
    return q;
  };

  let { data, error } = await buildQuery(selectWithAnalysis);

  // Fall back if the analysis table hasn't been migrated yet.
  if (error && isMissingRelation(error.message)) {
    ({ data, error } = await buildQuery(selectWithoutAnalysis));
  }
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => {
    const row = r as unknown as ReviewWithBranch & {
      ftl_branches: {
        branch_name: string;
        branch_code: string | null;
        region: string | null;
        google_place_id: string | null;
      };
      ftl_review_analysis?: ReviewAnalysis | ReviewAnalysis[] | null;
    };
    const branch = row.ftl_branches;
    const rawAnalysis = row.ftl_review_analysis;
    const analysis = Array.isArray(rawAnalysis) ? rawAnalysis[0] ?? null : rawAnalysis ?? null;
    return {
      ...row,
      branch_name: branch.branch_name,
      branch_code: branch.branch_code,
      region: branch.region,
      google_place_id: branch.google_place_id,
      analysis,
    };
  });
}

function isMissingRelation(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("could not find") ||
    m.includes("does not exist") ||
    m.includes("schema cache") ||
    m.includes("relationship")
  );
}

export async function getTopComplaints(limit = 10): Promise<ComplaintTheme[]> {
  if (!client) return [];
  const { data, error } = await client
    .from("ftl_top_complaints")
    .select("*")
    .limit(limit);
  if (error) {
    if (isMissingRelation(error.message)) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as ComplaintTheme[];
}

export async function getTopKeywords(limit = 15): Promise<ComplaintKeyword[]> {
  if (!client) return [];
  const { data, error } = await client
    .from("ftl_top_keywords")
    .select("*")
    .limit(limit);
  if (error) {
    if (isMissingRelation(error.message)) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as ComplaintKeyword[];
}

export async function getComplaintSpikes(): Promise<BranchComplaintSpike[]> {
  if (!client) return [];
  const { data, error } = await client
    .from("ftl_branch_complaint_spikes")
    .select("*");
  if (error) {
    if (isMissingRelation(error.message)) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as BranchComplaintSpike[];
}

export async function getAnalysisCoverage(): Promise<{
  analyzed: number;
  total: number;
  migrated: boolean;
}> {
  if (!client) return { analyzed: 0, total: 0, migrated: false };
  const [analyzedRes, totalRes] = await Promise.all([
    client.from("ftl_review_analysis").select("review_id", { count: "exact", head: true }),
    client
      .from("ftl_reviews")
      .select("id", { count: "exact", head: true })
      .not("review_text", "is", null),
  ]);
  const migrated = !(analyzedRes.error && isMissingRelation(analyzedRes.error.message));
  if (analyzedRes.error && !migrated) {
    return { analyzed: 0, total: totalRes.count ?? 0, migrated: false };
  }
  return {
    analyzed: analyzedRes.count ?? 0,
    total: totalRes.count ?? 0,
    migrated,
  };
}

export async function getRecentSyncLogs(limit = 10): Promise<SyncLog[]> {
  if (!client) return mockSyncLogs.slice(0, limit);
  const { data, error } = await client
    .from("ftl_review_sync_log")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as SyncLog[];
}

import Link from "next/link";
import { getBranches, getReviews } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { ReviewCard } from "@/components/review-card";
import { BranchSelect } from "@/components/branch-select";
import type { Sentiment } from "@/lib/types";

type Search = {
  branch?: string;
  sentiment?: Sentiment;
  rating?: string;
};

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const [branches, reviews] = await Promise.all([
    getBranches(),
    getReviews({
      branchId: sp.branch,
      sentiment: sp.sentiment,
      minRating: sp.rating ? parseInt(sp.rating, 10) : undefined,
      maxRating: sp.rating ? parseInt(sp.rating, 10) : undefined,
      limit: 200,
    }),
  ]);

  const activeBranch = sp.branch ? branches.find((b) => b.id === sp.branch) : null;

  const makeQuery = (next: Partial<Search>) => {
    const merged = { ...sp, ...next };
    // treat empty values as clear
    const params = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    const qs = params.toString();
    return qs ? `/reviews?${qs}` : "/reviews";
  };

  const sentiments: Array<Sentiment | "all"> = ["all", "positive", "neutral", "negative"];
  const ratings: Array<string> = ["", "5", "4", "3", "2", "1"];

  return (
    <>
      <PageHeader
        title="Reviews"
        description={`${reviews.length} review${reviews.length === 1 ? "" : "s"}${activeBranch ? ` · ${activeBranch.branch_name}` : ""}`}
      />

      <div className="p-8 space-y-6">
        <div className="panel p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-ink-muted w-16">Branch</span>
            <BranchSelect branches={branches} value={sp.branch} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-ink-muted w-16">Sentiment</span>
            {sentiments.map((s) => {
              const active = (s === "all" && !sp.sentiment) || sp.sentiment === s;
              return (
                <Link
                  key={s}
                  href={makeQuery({ sentiment: s === "all" ? undefined : (s as Sentiment) })}
                  className={`text-xs capitalize px-3 py-1 rounded-full border transition-colors ${active ? "bg-accent text-accent-ink border-accent" : "border-border text-ink-muted hover:text-ink"}`}
                >
                  {s}
                </Link>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-ink-muted w-16">Rating</span>
            {ratings.map((r) => {
              const active = (r === "" && !sp.rating) || sp.rating === r;
              return (
                <Link
                  key={r || "all"}
                  href={makeQuery({ rating: r || undefined })}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${active ? "bg-accent text-accent-ink border-accent" : "border-border text-ink-muted hover:text-ink"}`}
                >
                  {r ? `${r}★` : "All"}
                </Link>
              );
            })}
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="panel p-12 text-center text-ink-muted">No reviews match these filters.</div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

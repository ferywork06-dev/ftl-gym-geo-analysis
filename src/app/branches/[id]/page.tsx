import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, ExternalLink } from "lucide-react";
import { getBranchById, getReviews } from "@/lib/data";
import { PageHeader, StatCard, Stars, Tag, formatRelative } from "@/components/ui";
import { ReviewCard } from "@/components/review-card";

export default async function BranchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const branch = await getBranchById(id);
  if (!branch) notFound();
  const reviews = await getReviews({ branchId: id, limit: 100 });

  const positive = reviews.filter((r) => r.rating >= 4).length;
  const neutral = reviews.filter((r) => r.rating === 3).length;
  const negative = reviews.filter((r) => r.rating <= 2).length;
  const unanswered = reviews.filter((r) => r.rating <= 2 && !r.is_responded).length;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.branch_name)}&query_place_id=${branch.google_place_id}`;

  return (
    <>
      <div className="px-8 py-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink">
          <ArrowLeft className="w-3 h-3" /> Back to overview
        </Link>
      </div>

      <PageHeader
        title={branch.branch_name}
        description={`${branch.city ?? ""}${branch.region ? " · " + branch.region : ""}`}
      >
        {branch.branch_code && <Tag>{branch.branch_code}</Tag>}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink border border-border rounded-full px-3 py-1"
        >
          <MapPin className="w-3 h-3" /> Google Maps <ExternalLink className="w-3 h-3" />
        </a>
      </PageHeader>

      <div className="p-8 space-y-6">
        <div className="panel p-6 flex items-center justify-between gap-6">
          <div>
            <div className="text-[11px] tracking-wider text-ink-muted uppercase">Google rating</div>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-5xl font-semibold text-ink">
                {branch.google_rating?.toFixed(1) ?? "—"}
              </span>
              <Stars rating={branch.google_rating ?? 0} size={18} />
            </div>
            <div className="text-sm text-ink-muted mt-2">
              {(branch.total_reviews ?? 0).toLocaleString()} reviews on Google
            </div>
          </div>
          <div className="text-right text-xs text-ink-muted">
            <div>
              Last synced{" "}
              <span className="text-ink">
                {formatRelative(
                  branch.last_synced_at ? Math.floor(new Date(branch.last_synced_at).getTime() / 1000) : null,
                )}
              </span>
            </div>
            <div className="mt-1">
              {branch.stored_reviews} sample review{branch.stored_reviews === 1 ? "" : "s"} stored
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Positive (4–5★)" value={positive} tone="positive" />
          <StatCard label="Neutral (3★)" value={neutral} tone="neutral" />
          <StatCard label="Negative (1–2★)" value={negative} tone={negative > 0 ? "negative" : "default"} />
          <StatCard label="Needs response" value={unanswered} tone={unanswered > 0 ? "negative" : "positive"} />
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-ink-muted mb-3">
            Recent reviews
          </h2>
          {reviews.length === 0 ? (
            <div className="panel p-12 text-center text-ink-muted">No reviews yet.</div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} showBranch={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

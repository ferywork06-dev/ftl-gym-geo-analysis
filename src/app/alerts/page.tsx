import { AlertTriangle } from "lucide-react";
import { getReviews } from "@/lib/data";
import { PageHeader, StatCard } from "@/components/ui";
import { ReviewCard } from "@/components/review-card";

export default async function AlertsPage() {
  const [negative, flagged] = await Promise.all([
    getReviews({ maxRating: 2, limit: 100 }),
    getReviews({ flaggedOnly: true, limit: 100 }),
  ]);

  const unanswered = negative.filter((r) => !r.is_responded);
  const seen = new Set<string>();
  const combined = [...unanswered, ...negative.filter((r) => r.is_responded), ...flagged].filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  return (
    <>
      <PageHeader
        title="Alerts"
        description="Negative & flagged reviews that need attention"
      />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Negative (1–2★)" value={negative.length} tone="negative" />
          <StatCard label="Unanswered" value={unanswered.length} tone={unanswered.length > 0 ? "negative" : "positive"} />
          <StatCard label="Flagged" value={flagged.length} tone="neutral" />
        </div>

        {combined.length === 0 ? (
          <div className="panel p-12 text-center text-ink-muted">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-positive" />
            No alerts right now — nice.
          </div>
        ) : (
          <div className="space-y-3">
            {combined.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

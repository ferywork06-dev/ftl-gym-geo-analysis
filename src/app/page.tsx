import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getBranches, getReviews, getRecentSyncLogs } from "@/lib/data";
import { BranchThumb, PageHeader, StatCard, Stars, Tag, formatRelative } from "@/components/ui";
import { SyncPhotosButton } from "@/components/sync-photos-button";

export default async function OverviewPage() {
  const [branches, reviews, syncLogs] = await Promise.all([
    getBranches(),
    getReviews({ limit: 500 }),
    getRecentSyncLogs(1),
  ]);

  const totalReviews = branches.reduce((sum, b) => sum + (b.total_reviews ?? 0), 0);
  const weightedAvg =
    totalReviews > 0
      ? branches.reduce((sum, b) => sum + (b.google_rating ?? 0) * (b.total_reviews ?? 0), 0) / totalReviews
      : 0;
  const negativeCount = reviews.filter((r) => r.rating <= 2).length;
  const needsResponse = reviews.filter((r) => r.rating <= 2 && !r.is_responded).length;
  const lastSync = syncLogs[0];
  const missingPhotos = branches.filter((b) => !b.photo_uri).length;

  const regions = Array.from(new Set(branches.map((b) => b.region).filter(Boolean))) as string[];
  const byRegion = regions.map((region) => ({
    region,
    branches: branches.filter((b) => b.region === region),
  }));

  return (
    <>
      <PageHeader
        title="Network Overview"
        description={`${branches.length} active branches · ${totalReviews.toLocaleString()} total Google reviews`}
      >
        <SyncPhotosButton missingCount={missingPhotos} />
        {lastSync && (
          <span className="text-xs text-ink-muted">
            Last sync · {formatRelative(Math.floor(new Date(lastSync.started_at).getTime() / 1000))}
          </span>
        )}
      </PageHeader>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Branches"
            value={branches.length}
            hint="active locations"
          />
          <StatCard
            label="Avg. rating"
            value={weightedAvg.toFixed(2)}
            hint="weighted by review volume"
            tone={weightedAvg >= 4.5 ? "positive" : weightedAvg >= 4 ? "default" : "neutral"}
          />
          <StatCard
            label="Total reviews"
            value={totalReviews.toLocaleString()}
            hint="aggregated from Google"
          />
          <StatCard
            label="Needs response"
            value={needsResponse}
            hint={`${negativeCount} negative in sample`}
            tone={needsResponse > 0 ? "negative" : "positive"}
          />
        </div>

        {byRegion.map(({ region, branches: regionBranches }) => (
          <section key={region} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-ink-muted">
                {region} · {regionBranches.length}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {regionBranches.map((b) => (
                <Link
                  key={b.id}
                  href={`/branches/${b.id}`}
                  className="panel px-5 py-4 hover:border-accent transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <BranchThumb
                      name={b.branch_name}
                      code={b.branch_code}
                      photoUri={b.photo_uri}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                            {b.branch_code && <Tag>{b.branch_code}</Tag>}
                            <span>{b.city}</span>
                          </div>
                          <div className="font-semibold text-ink mt-1 truncate">
                            {b.branch_name}
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>

                      <div className="flex items-end justify-between mt-3">
                        <div>
                          <div className="text-2xl font-semibold text-ink leading-none">
                            {b.google_rating?.toFixed(1) ?? "—"}
                          </div>
                          <div className="mt-1.5">
                            <Stars rating={b.google_rating ?? 0} />
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-ink-muted">
                          <div>{(b.total_reviews ?? 0).toLocaleString()} reviews</div>
                          {b.negative_reviews > 0 && (
                            <div className="text-negative mt-1">
                              {b.negative_reviews} recent negative
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

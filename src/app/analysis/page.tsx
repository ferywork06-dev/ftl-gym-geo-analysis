import Link from "next/link";
import { TrendingUp, AlertTriangle, Hash } from "lucide-react";
import {
  getAnalysisCoverage,
  getComplaintSpikes,
  getTopComplaints,
  getTopKeywords,
} from "@/lib/data";
import { PageHeader, StatCard, Tag } from "@/components/ui";
import { AnalyzeButton } from "@/components/analyze-button";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  const [complaints, keywords, spikes, coverage] = await Promise.all([
    getTopComplaints(12),
    getTopKeywords(18),
    getComplaintSpikes(),
    getAnalysisCoverage(),
  ]);

  const pending = coverage.migrated ? Math.max(0, coverage.total - coverage.analyzed) : 0;
  const spiking = spikes.filter((s) => s.is_spiking);
  const maxComplaintMentions = complaints[0]?.mentions ?? 0;
  const maxKeywordMentions = keywords[0]?.mentions ?? 0;

  return (
    <>
      <PageHeader
        title="Analysis"
        description="Themes, keywords, and complaint spikes"
      >
        {coverage.migrated && <AnalyzeButton pendingCount={pending} />}
      </PageHeader>

      <div className="p-8 space-y-6">
        {!coverage.migrated && (
          <div className="panel p-5 border-l-4 border-l-accent">
            <div className="text-sm font-semibold text-ink">Migration required</div>
            <p className="text-sm text-ink-muted mt-1 leading-relaxed">
              Run{" "}
              <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-muted">
                backend/analysis-schema.sql
              </code>{" "}
              in the Supabase SQL editor, then add{" "}
              <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-muted">
                SUPABASE_SERVICE_ROLE_KEY
              </code>{" "}
              and{" "}
              <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-muted">
                GEMINI_API_KEY
              </code>{" "}
              to <code className="font-mono text-xs">.env.local</code>. Once the views exist,
              reload this page and click &ldquo;Analyze reviews&rdquo;.
            </p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Reviews analyzed"
            value={coverage.analyzed}
            hint={`of ${coverage.total} total`}
          />
          <StatCard
            label="Pending analysis"
            value={pending}
            tone={pending > 0 ? "neutral" : "positive"}
          />
          <StatCard
            label="Distinct complaint themes"
            value={complaints.length}
          />
          <StatCard
            label="Branches spiking"
            value={spiking.length}
            tone={spiking.length > 0 ? "negative" : "positive"}
            hint="Last 7d vs prior 30d"
          />
        </div>

        <section>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-ink-muted mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Branches with rising complaints
          </h2>
          {spikes.length === 0 ? (
            <div className="panel p-8 text-center text-ink-muted text-sm">
              {coverage.analyzed === 0
                ? "Run analysis to start tracking complaint spikes."
                : "No complaint spikes detected in the last 7 days."}
            </div>
          ) : (
            <div className="panel overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted/60 text-[10px] uppercase tracking-wider text-ink-muted">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Branch</th>
                    <th className="text-left px-4 py-2.5 font-medium">Region</th>
                    <th className="text-right px-4 py-2.5 font-medium">Last 7d</th>
                    <th className="text-right px-4 py-2.5 font-medium">Baseline / wk</th>
                    <th className="text-right px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {spikes.slice(0, 15).map((s) => (
                    <tr key={s.branch_id} className="border-t border-border">
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/branches/${s.branch_id}`}
                          className="text-ink hover:underline font-medium"
                        >
                          {s.branch_name}
                        </Link>
                        {s.branch_code && (
                          <span className="ml-2">
                            <Tag>{s.branch_code}</Tag>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-ink-muted">{s.region ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{s.recent_7d}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-ink-muted">
                        {s.baseline_weekly.toFixed(1)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {s.is_spiking ? (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-negative/30 text-negative bg-negative/5">
                            <TrendingUp className="w-3 h-3" />
                            Spike
                          </span>
                        ) : (
                          <span className="text-xs text-ink-muted">Stable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink-muted mb-3">
              Most mentioned complaints
            </h2>
            {complaints.length === 0 ? (
              <div className="panel p-8 text-center text-ink-muted text-sm">
                No complaint themes yet.
              </div>
            ) : (
              <div className="panel divide-y divide-border">
                {complaints.map((c) => {
                  const pct = maxComplaintMentions
                    ? (c.mentions / maxComplaintMentions) * 100
                    : 0;
                  return (
                    <div key={c.theme} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-ink">{c.theme}</span>
                        <span className="text-xs text-ink-muted shrink-0">
                          {c.mentions} · {c.branches_affected} branch
                          {c.branches_affected === 1 ? "" : "es"}
                        </span>
                      </div>
                      <div className="mt-2 h-1 rounded-full bg-surface-muted overflow-hidden">
                        <div
                          className="h-full bg-negative/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink-muted mb-3 flex items-center gap-2">
              <Hash className="w-3.5 h-3.5" />
              Top keywords
            </h2>
            {keywords.length === 0 ? (
              <div className="panel p-8 text-center text-ink-muted text-sm">
                No keywords extracted yet.
              </div>
            ) : (
              <div className="panel p-4 flex flex-wrap gap-2">
                {keywords.map((k) => {
                  const weight = maxKeywordMentions
                    ? k.mentions / maxKeywordMentions
                    : 0;
                  const size =
                    weight > 0.66 ? "text-sm" : weight > 0.33 ? "text-xs" : "text-[11px]";
                  return (
                    <span
                      key={k.keyword}
                      className={`inline-flex items-center gap-1.5 ${size} px-2.5 py-1 rounded-full border border-border bg-surface text-ink`}
                    >
                      {k.keyword}
                      <span className="text-ink-muted">{k.mentions}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

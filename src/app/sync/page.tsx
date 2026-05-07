import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { getRecentSyncLogs } from "@/lib/data";
import { PageHeader, formatRelative } from "@/components/ui";

export default async function SyncPage() {
  const logs = await getRecentSyncLogs(20);

  return (
    <>
      <PageHeader title="Sync Log" description="Daily Google Places pulls via Supabase Edge Function" />

      <div className="p-8">
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-ink-muted">
                <th className="text-left font-medium px-5 py-3">Status</th>
                <th className="text-left font-medium px-5 py-3">Started</th>
                <th className="text-right font-medium px-5 py-3">Duration</th>
                <th className="text-right font-medium px-5 py-3">Branches</th>
                <th className="text-right font-medium px-5 py-3">New reviews</th>
                <th className="text-right font-medium px-5 py-3">Errors</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const started = new Date(log.started_at);
                const finished = log.finished_at ? new Date(log.finished_at) : null;
                const duration = finished
                  ? `${Math.round((finished.getTime() - started.getTime()) / 1000)}s`
                  : "—";
                const errorsCount = Array.isArray(log.errors) ? (log.errors as unknown[]).length : 0;
                const icon =
                  log.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-positive" />
                  ) : log.status === "failed" ? (
                    <XCircle className="w-4 h-4 text-negative" />
                  ) : (
                    <Clock className="w-4 h-4 text-ink-muted" />
                  );
                return (
                  <tr key={log.id} className="border-t border-border">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-2 capitalize text-ink">
                        {icon}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {formatRelative(Math.floor(started.getTime() / 1000))}
                      <span className="text-ink-muted/70 ml-2 text-xs">
                        {started.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-ink-muted font-mono text-xs">{duration}</td>
                    <td className="px-5 py-3 text-right text-ink">{log.branches_processed}</td>
                    <td className="px-5 py-3 text-right text-ink">{log.new_reviews_found}</td>
                    <td className={`px-5 py-3 text-right ${errorsCount > 0 ? "text-negative" : "text-ink-muted"}`}>
                      {errorsCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

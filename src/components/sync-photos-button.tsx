"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";

type Props = { missingCount: number };

export function SyncPhotosButton({ missingCount }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const disabled = running || isPending || missingCount === 0;

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/sync-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: Math.min(60, missingCount) }),
      });
      const data = (await res.json()) as {
        processed?: number;
        errors?: Array<{ branch_id: string; message: string }>;
        remaining?: number;
        error?: string;
      };
      if (!res.ok) {
        setResult(data.error ?? `Failed (${res.status})`);
      } else {
        const errPart = data.errors?.length ? ` · ${data.errors.length} errors` : "";
        const remainPart =
          typeof data.remaining === "number" ? ` · ${data.remaining} remaining` : "";
        setResult(`Synced ${data.processed ?? 0}${errPart}${remainPart}`);
        startTransition(() => router.refresh());
      }
    } catch (e) {
      setResult((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  if (missingCount === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border bg-surface text-ink hover:border-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {running ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ImageIcon className="w-3.5 h-3.5" />
        )}
        {running ? "Syncing photos…" : `Sync ${missingCount} photo${missingCount === 1 ? "" : "s"}`}
      </button>
      {result && <span className="text-xs text-ink-muted">{result}</span>}
    </div>
  );
}

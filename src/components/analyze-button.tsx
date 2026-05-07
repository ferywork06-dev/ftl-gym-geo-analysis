"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sparkles, Loader2 } from "lucide-react";

type Props = { pendingCount: number };

export function AnalyzeButton({ pendingCount }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const disabled = running || isPending || pendingCount === 0;

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const batch = Math.min(25, pendingCount);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: batch }),
      });
      const data = (await res.json()) as {
        processed?: number;
        errors?: Array<{ review_id: string; message: string }>;
        remaining?: number;
        error?: string;
      };
      if (!res.ok) {
        setResult(data.error ?? `Failed (${res.status})`);
      } else {
        const errPart = data.errors?.length ? ` · ${data.errors.length} errors` : "";
        const remainPart =
          typeof data.remaining === "number" ? ` · ${data.remaining} remaining` : "";
        setResult(`Analyzed ${data.processed ?? 0}${errPart}${remainPart}`);
        startTransition(() => router.refresh());
      }
    } catch (e) {
      setResult((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-accent bg-accent text-accent-ink hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {running ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        {running
          ? "Analyzing…"
          : pendingCount === 0
            ? "Up to date"
            : `Analyze ${Math.min(25, pendingCount)} review${pendingCount === 1 ? "" : "s"}`}
      </button>
      {result && <span className="text-xs text-ink-muted">{result}</span>}
    </div>
  );
}

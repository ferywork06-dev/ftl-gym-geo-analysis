"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import type { BranchSummary } from "@/lib/types";

type Props = { branches: BranchSummary[]; value?: string };

export function BranchSelect({ branches, value }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const grouped = branches.reduce<Record<string, BranchSummary[]>>((acc, b) => {
    const region = b.region || "Other";
    (acc[region] ||= []).push(b);
    return acc;
  }, {});

  const regionOrder = Object.keys(grouped).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  const handleChange = (nextValue: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextValue) params.set("branch", nextValue);
    else params.delete("branch");
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    startTransition(() => {
      router.push(url);
      router.refresh();
    });
  };

  return (
    <select
      value={value ?? ""}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value)}
      className="text-xs px-3 py-1.5 rounded-md border border-border bg-surface text-ink focus:outline-none focus:border-accent hover:border-ink-muted transition-colors min-w-[260px] cursor-pointer disabled:opacity-60"
    >
      <option value="">All branches ({branches.length})</option>
      {regionOrder.map((region) => (
        <optgroup key={region} label={region}>
          {grouped[region]
            .slice()
            .sort((a, b) => a.branch_name.localeCompare(b.branch_name))
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_code ? `${b.branch_code} — ${b.branch_name}` : b.branch_name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}

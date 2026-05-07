"use client";

import { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";

type Props = {
  reply: string;
  themes?: string[];
};

export function SuggestedReply({ reply, themes }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mt-3 rounded-md border border-accent/30 bg-accent/5 p-3">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-accent font-medium">
          <Sparkles className="w-3 h-3" />
          Suggested reply
        </div>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Copy
            </>
          )}
        </button>
      </div>
      <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{reply}</p>
      {themes && themes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {themes.map((t) => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-full border border-border text-ink-muted bg-surface"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

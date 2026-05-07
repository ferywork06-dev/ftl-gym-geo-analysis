import { Star } from "lucide-react";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-8 py-6 flex items-center justify-between gap-6">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        {description && <p className="text-sm text-ink-muted mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "positive" | "neutral" | "negative" | "default";
}) {
  const toneClass =
    tone === "positive"
      ? "text-positive"
      : tone === "neutral"
        ? "text-neutral"
        : tone === "negative"
          ? "text-negative"
          : "text-ink";
  return (
    <div className="panel px-5 py-4">
      <div className="text-[11px] tracking-wider text-ink-muted uppercase">{label}</div>
      <div className={`text-3xl font-semibold mt-2 ${toneClass}`}>{value}</div>
      {hint && <div className="text-xs text-ink-muted mt-1">{hint}</div>}
    </div>
  );
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const total = 5;
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < full;
        const half = !filled && i === full && hasHalf;
        return (
          <Star
            key={i}
            width={size}
            height={size}
            strokeWidth={1.5}
            className={filled ? "fill-gold text-gold" : half ? "fill-gold/50 text-gold" : "text-border"}
          />
        );
      })}
    </div>
  );
}

export function SentimentPill({ sentiment }: { sentiment: "positive" | "neutral" | "negative" | null }) {
  if (!sentiment) return null;
  const map = {
    positive: { label: "Positive", cls: "bg-positive/10 text-positive border-positive/20" },
    neutral: { label: "Neutral", cls: "bg-neutral/10 text-neutral border-neutral/20" },
    negative: { label: "Negative", cls: "bg-negative/10 text-negative border-negative/20" },
  }[sentiment];
  return (
    <span className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${map.cls}`}>
      {map.label}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-border text-ink-muted bg-surface-muted">
      {children}
    </span>
  );
}

const THUMB_HUES = [18, 32, 42, 210, 168, 280, 350, 120];

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function BranchThumb({
  name,
  code,
  photoUri,
  size = 56,
}: {
  name: string;
  code?: string | null;
  photoUri?: string | null;
  size?: number;
}) {
  const label = (code ?? name.replace(/^FTL GYM\s*/i, "").slice(0, 2)).toUpperCase();
  const hue = THUMB_HUES[hashString(name) % THUMB_HUES.length];
  const bg = `linear-gradient(135deg, hsl(${hue} 22% 22%), hsl(${hue} 18% 14%))`;

  if (photoUri) {
    return (
      <div
        className="shrink-0 rounded-lg overflow-hidden bg-surface-muted"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUri}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="shrink-0 rounded-lg flex items-center justify-center font-mono font-semibold text-accent-ink tracking-tight"
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: label.length > 2 ? size * 0.28 : size * 0.36,
      }}
      aria-hidden
    >
      {label}
    </div>
  );
}

export function formatRelative(unix: number | null): string {
  if (!unix) return "—";
  const diff = Date.now() / 1000 - unix;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / (86400 * 7))}w ago`;
  return `${Math.floor(diff / (86400 * 30))}mo ago`;
}

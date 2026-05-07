import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { MapPin, Star, AlertTriangle, Activity, Sparkles, Map } from "lucide-react";
import { isMockMode } from "@/lib/data";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FTL Reviews — Google Maps Dashboard",
  description: "Monitor Google Maps reviews across all FTL GYM branches.",
};

function Nav() {
  const items = [
    { href: "/", label: "Overview", Icon: MapPin },
    { href: "/reviews", label: "Reviews", Icon: Star },
    { href: "/analysis", label: "Analysis", Icon: Sparkles },
    { href: "/geo", label: "Geo Analysis", Icon: Map },
    { href: "/alerts", label: "Alerts", Icon: AlertTriangle },
    { href: "/sync", label: "Sync Log", Icon: Activity },
  ];
  return (
    <aside className="w-60 shrink-0 bg-surface-muted/40 flex flex-col">
      <div className="px-6 py-6">
        <div className="text-[10px] tracking-[0.25em] text-ink-muted uppercase">FTL Gym</div>
        <div className="text-lg font-semibold text-ink mt-0.5">Reviews</div>
        <div className="text-[11px] text-ink-muted mt-0.5">Google Maps Dashboard</div>
      </div>
      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        {items.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-ink-muted hover:text-ink hover:bg-surface transition-colors"
          >
            <Icon className="w-4 h-4" strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </nav>
      {isMockMode() && (
        <div className="m-3 p-3 rounded-md border border-border bg-surface text-[11px] leading-relaxed text-ink-muted">
          <div className="font-semibold text-ink mb-1">Demo mode</div>
          Set <code className="font-mono text-[10px]">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono text-[10px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
          <code className="font-mono text-[10px]">.env.local</code> to connect live data.
        </div>
      )}
    </aside>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex">
        <Nav />
        <main className="flex-1 min-w-0">{children}</main>
      </body>
    </html>
  );
}

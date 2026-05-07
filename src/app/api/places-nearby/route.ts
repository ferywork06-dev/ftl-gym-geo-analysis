import { NextResponse } from "next/server";
import { getAdminClient, hasAdminCredentials } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Cache TTL: 30 days
const CACHE_TTL_DAYS = 30;

const BASE = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const DISTANCE_MATRIX_BASE = "https://maps.googleapis.com/maps/api/distancematrix/json";

type PlacesResponse = {
  results: Record<string, unknown>[];
  next_page_token?: string;
  status: string;
  error_message?: string;
};

async function fetchPage(params: URLSearchParams): Promise<PlacesResponse> {
  const res = await fetch(`${BASE}?${params}`);
  return res.json();
}

async function fetchAllPages(base: URLSearchParams, apiKey: string, maxPages = 3): Promise<Record<string, unknown>[]> {
  const first = await fetchPage(base);
  if (first.status === "REQUEST_DENIED" || first.status === "INVALID_REQUEST") return [];

  const results = [...(first.results ?? [])];
  let token = first.next_page_token;

  for (let p = 1; p < maxPages && token; p++) {
    await new Promise(r => setTimeout(r, 2000));
    const next = await fetchPage(new URLSearchParams({ pagetoken: token, key: apiKey }));
    results.push(...(next.results ?? []));
    token = next.next_page_token;
  }

  return results;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getRoadDistances(
  origin: string,
  destinations: { lat: number; lng: number }[],
  apiKey: string
): Promise<(number | null)[]> {
  const BATCH = 25;
  const allDistances: (number | null)[] = [];

  for (let i = 0; i < destinations.length; i += BATCH) {
    const batch = destinations.slice(i, i + BATCH);
    const destStr = batch.map(d => `${d.lat},${d.lng}`).join("|");
    const url = `${DISTANCE_MATRIX_BASE}?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destStr)}&mode=driving&key=${apiKey}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const elements: { status: string; distance?: { value: number } }[] = data.rows?.[0]?.elements ?? [];
      for (const el of elements) {
        allDistances.push(el.status === "OK" && el.distance ? el.distance.value : null);
      }
    } catch {
      for (let j = 0; j < batch.length; j++) allDistances.push(null);
    }
  }

  return allDistances;
}

async function getCache(branchCode: string, radius: number) {
  if (!hasAdminCredentials()) return null;
  const supabase = getAdminClient();
  const expiry = new Date(Date.now() - CACHE_TTL_DAYS * 86400 * 1000).toISOString();
  const { data } = await supabase
    .from("ftl_geo_cache")
    .select("places, cached_at")
    .eq("branch_code", branchCode)
    .eq("radius", radius)
    .gt("cached_at", expiry)
    .single();
  return data ?? null;
}

async function setCache(branchCode: string, radius: number, places: Record<string, unknown>[]) {
  if (!hasAdminCredentials()) return;
  const supabase = getAdminClient();
  await supabase.from("ftl_geo_cache").upsert(
    { branch_code: branchCode, radius, places, cached_at: new Date().toISOString() },
    { onConflict: "branch_code,radius" }
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.lat || !body?.lng || !body?.apiKey) {
    return NextResponse.json({ error: "Missing lat, lng, or apiKey" }, { status: 400 });
  }

  const { lat, lng, radius = 1000, apiKey, branchCode, nearbyBranchCoords } = body as {
    lat: number; lng: number; radius?: number; apiKey: string; branchCode?: string;
    nearbyBranchCoords?: { lat: number; lng: number; code: string }[];
  };

  const origin = `${lat},${lng}`;

  // Compute road distances for nearby FTL branches (always fresh, not cached)
  let nearbyBranchDistances: Record<string, number | null> = {};
  if (nearbyBranchCoords && nearbyBranchCoords.length > 0) {
    const dists = await getRoadDistances(origin, nearbyBranchCoords, apiKey);
    nearbyBranchCoords.forEach((b, i) => { nearbyBranchDistances[b.code] = dists[i]; });
  }

  // Check cache first
  if (branchCode) {
    const cached = await getCache(branchCode, radius);
    if (cached) {
      return NextResponse.json({
        results: cached.places,
        status: "OK",
        fromCache: true,
        cachedAt: cached.cached_at,
        nearbyBranchDistances,
      });
    }
  }

  const location = `${lat},${lng}`;
  const r = String(radius);

  const COMPETITOR_KEYWORDS = ["celebrity fitness", "osbond gym", "fitx gym", "fitx", "will fitness", "willfitness", "fitness first", "anytime fitness", "fithub"];

  const [genericResults, gymResults, perumahanResults, housingResults, ...competitorResults] = await Promise.all([
    fetchAllPages(new URLSearchParams({ location, radius: r, key: apiKey }), apiKey, 3),
    fetchAllPages(new URLSearchParams({ location, radius: r, type: "gym", key: apiKey }), apiKey, 1),
    fetchAllPages(new URLSearchParams({ location, radius: r, keyword: "perumahan", key: apiKey }), apiKey, 1),
    fetchAllPages(new URLSearchParams({ location, radius: r, keyword: "housing complex", key: apiKey }), apiKey, 1),
    ...COMPETITOR_KEYWORDS.map(kw =>
      fetchAllPages(new URLSearchParams({ location, radius: r, keyword: kw, key: apiKey }), apiKey, 1)
    ),
  ]);

  // Merge, deduplicate, filter by radius
  const seen = new Set<string>();
  const allResults: Record<string, unknown>[] = [];

  for (const place of [...genericResults, ...gymResults, ...perumahanResults, ...housingResults, ...competitorResults.flat()]) {
    const id = place.place_id as string;
    if (!id || seen.has(id)) continue;
    const placeLocation = (place.geometry as { location: { lat: number; lng: number } })?.location;
    if (placeLocation && haversine(lat, lng, placeLocation.lat, placeLocation.lng) > radius / 1000) continue;
    seen.add(id);
    allResults.push(place);
  }

  // Attach road distances to each place
  const placeCoords = allResults.map(p => {
    const loc = (p.geometry as { location: { lat: number; lng: number } })?.location;
    return { lat: loc?.lat ?? 0, lng: loc?.lng ?? 0 };
  });
  const roadDistances = await getRoadDistances(origin, placeCoords, apiKey);
  for (let i = 0; i < allResults.length; i++) {
    allResults[i].distance_road_m = roadDistances[i];
  }

  // Save to cache (includes distance_road_m)
  if (branchCode) {
    await setCache(branchCode, radius, allResults);
  }

  return NextResponse.json({ results: allResults, status: "OK", fromCache: false, nearbyBranchDistances });
}

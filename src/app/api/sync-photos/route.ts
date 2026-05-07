import { NextResponse } from "next/server";
import { getAdminClient, hasAdminCredentials } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_BASE = "https://places.googleapis.com/v1";
const MAX_HEIGHT_PX = 400;

type BranchRow = {
  id: string;
  branch_name: string;
  google_place_id: string;
};

type PlaceDetailsResponse = {
  photos?: Array<{
    name: string;
    authorAttributions?: Array<{ displayName?: string }>;
  }>;
};

type PhotoMediaResponse = {
  photoUri?: string;
};

export async function POST(req: Request) {
  if (!PLACES_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY not set" }, { status: 500 });
  }
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not set" }, { status: 500 });
  }

  const body = (await req.json().catch(() => ({}))) as { limit?: number; force?: boolean };
  const limit = Math.min(Math.max(body.limit ?? 60, 1), 200);
  const supabase = getAdminClient();

  let query = supabase
    .from("ftl_branches")
    .select("id, branch_name, google_place_id")
    .eq("is_active", true)
    .limit(limit);
  if (!body.force) query = query.is("photo_uri", null);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const branches = (data ?? []) as BranchRow[];
  const errors: Array<{ branch_id: string; message: string }> = [];
  let processed = 0;

  for (const branch of branches) {
    try {
      const details = await fetchPlaceDetails(branch.google_place_id);
      const photoName = details.photos?.[0]?.name;
      if (!photoName) {
        errors.push({ branch_id: branch.id, message: "No photo available" });
        continue;
      }

      const attribution = details.photos?.[0]?.authorAttributions?.[0]?.displayName ?? null;
      const media = await fetchPhotoMedia(photoName);
      if (!media.photoUri) {
        errors.push({ branch_id: branch.id, message: "No photoUri in media response" });
        continue;
      }

      const { error: updateError } = await supabase
        .from("ftl_branches")
        .update({
          photo_uri: media.photoUri,
          photo_attribution: attribution,
          photo_synced_at: new Date().toISOString(),
        })
        .eq("id", branch.id);

      if (updateError) errors.push({ branch_id: branch.id, message: updateError.message });
      else processed += 1;

      await sleep(150);
    } catch (e) {
      errors.push({ branch_id: branch.id, message: (e as Error).message });
    }
  }

  const { count: remaining } = await supabase
    .from("ftl_branches")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .is("photo_uri", null);

  return NextResponse.json({ processed, errors, remaining: remaining ?? 0 });
}

async function fetchPlaceDetails(placeId: string): Promise<PlaceDetailsResponse> {
  const res = await fetch(`${PLACES_BASE}/places/${placeId}?fields=id,photos`, {
    headers: {
      "X-Goog-Api-Key": PLACES_API_KEY!,
      "X-Goog-FieldMask": "id,photos",
    },
  });
  if (!res.ok) throw new Error(`Places details ${res.status}: ${await res.text()}`);
  return (await res.json()) as PlaceDetailsResponse;
}

async function fetchPhotoMedia(photoName: string): Promise<PhotoMediaResponse> {
  const url = `${PLACES_BASE}/${photoName}/media?maxHeightPx=${MAX_HEIGHT_PX}&skipHttpRedirect=true`;
  const res = await fetch(url, {
    headers: { "X-Goog-Api-Key": PLACES_API_KEY! },
  });
  if (!res.ok) throw new Error(`Places media ${res.status}: ${await res.text()}`);
  return (await res.json()) as PhotoMediaResponse;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import { NextResponse } from "next/server";
import { getAdminClient, hasAdminCredentials } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(req: Request) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not set" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const branchCode = searchParams.get("branchCode");

  const supabase = getAdminClient();
  let query = supabase.from("ftl_geo_cache").delete();
  if (branchCode) {
    query = query.eq("branch_code", branchCode);
  } else {
    // Delete all rows — filter on a column that's always true
    query = query.gte("cached_at", "1970-01-01");
  }

  const { error, count } = await query.select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: count ?? 0, branchCode: branchCode ?? "all" });
}

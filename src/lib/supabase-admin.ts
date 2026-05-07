import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let admin: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (admin) return admin;
  if (!URL || !SERVICE_KEY) {
    throw new Error(
      "Supabase admin client unavailable. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }
  admin = createClient(URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

export function hasAdminCredentials(): boolean {
  return Boolean(URL && SERVICE_KEY);
}

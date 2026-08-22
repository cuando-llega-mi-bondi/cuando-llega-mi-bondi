import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseSecretKey, supabaseUrl } from "@/lib/server/supabaseEnv";

export function createAdminClient(): SupabaseClient {
  const url = supabaseUrl();
  const key = supabaseSecretKey();
  if (!url || !key) {
    throw new Error("Supabase admin client is not configured");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isAdCheckoutConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseSecretKey() && process.env.MERCADOPAGO_ACCESS_TOKEN);
}

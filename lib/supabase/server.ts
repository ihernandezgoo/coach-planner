import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente solo de servidor con la clave secreta: no hay login, así que salta RLS.
// Nunca importes este archivo desde un Client Component.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env");
  }
  return createSupabaseClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

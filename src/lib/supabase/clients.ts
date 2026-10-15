import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readSupabaseConfig } from "@/config/env";

export function createSupabaseAnonClient() {
  const config = readSupabaseConfig();
  if (!config) return null;
  return createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createSupabaseAdminClient() {
  const config = readSupabaseConfig();
  if (!config?.serviceRoleKey) return null;
  return createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createSupabaseServerClient() {
  const config = readSupabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot always write cookies. The proxy refreshes sessions.
        }
      },
    },
  });
}

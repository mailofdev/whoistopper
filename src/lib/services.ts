import "server-only";
import { isMockDataEnabled } from "@/config/data-source";
import type { AppServices } from "@/lib/data/contracts";
import { mockServices } from "@/mocks/services";
import { supabaseServices } from "@/lib/supabase/services";

export function getServices(): AppServices {
  if (process.env.NODE_ENV === "production") return supabaseServices;
  return isMockDataEnabled() ? mockServices : supabaseServices;
}

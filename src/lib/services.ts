import "server-only";
import type { AppServices } from "@/lib/data/contracts";
import { supabaseServices } from "@/lib/supabase/services";

export function getServices(): AppServices {
  return supabaseServices;
}

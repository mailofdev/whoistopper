import { redirect, forbidden } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/clients";
import { isAdmin } from "@/lib/security/authorization";
import type { SessionUser, UserRole } from "@/types/domain";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const profile = await supabase.from("profiles").select("id, email, display_name, username, role, bio, website, deleted_at").eq("id", data.user.id).maybeSingle();
  if (!profile.data || profile.data.deleted_at) return null;
  const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return {
    id: profile.data.id,
    email: profile.data.email,
    displayName: profile.data.display_name,
    username: profile.data.username,
    role: profile.data.role as UserRole,
    emailVerified: Boolean(data.user.email_confirmed_at),
    mfaEnabled: assurance.data?.currentLevel === "aal2",
    bio: profile.data.bio,
    website: profile.data.website,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAdmin(user)) forbidden();
  const mfaRequired = process.env.NODE_ENV === "production" && process.env.REQUIRE_ADMIN_MFA !== "false";
  if (mfaRequired && !user.mfaEnabled) redirect("/auth/mfa");
  return user;
}

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { forbidden } from "next/navigation";
import { isMockDataEnabled } from "@/config/data-source";
import { mockAuth } from "@/mocks/auth";
import { createSupabaseServerClient } from "@/lib/supabase/clients";
import { isAdmin } from "@/lib/security/authorization";
import type { SessionUser, UserRole } from "@/types/domain";

export const SESSION_COOKIE = "wit_session";

function secret(): string {
  return process.env.MOCK_SESSION_SECRET || "dev-only-mock-session";
}

export function sealUserId(userId: string): string {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Mock sessions are disabled in production.");
  }
  const expires = Date.now() + 14 * 24 * 60 * 60 * 1000;
  const body = `${userId}.${expires}`;
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function openUserId(token: string, now: number): string | null {
  if (process.env.NODE_ENV === "production") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expires, signature] = parts;
  if (!userId || !expires || !signature) return null;
  const expected = createHmac("sha256", secret()).update(`${userId}.${expires}`).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  if (Number(expires) < now) return null;
  return userId;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (isMockDataEnabled()) {
    await connection();
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const userId = openUserId(token, Date.now());
    return userId ? mockAuth.userById(userId) : null;
  }
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

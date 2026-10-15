"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { siteUrl } from "@/config/site";
import { AppError, toPublicError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/clients";
import { loginSchema, passwordSchema, resetSchema, signupSchema } from "@/lib/validation/schemas";

async function limit(action: string, email: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const result = rateLimit(`${action}:${ip}:${email}`, action === "login" ? 8 : 5, 15 * 60 * 1000);
  if (!result.ok) throw new AppError("Too many attempts. Try again later.", "rate_limit", 429);
}

export async function loginAction(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  try {
    await limit("login", parsed.data.email);
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { ok: false, error: "Sign-in is not configured yet." };
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { ok: false, error: "Email or password is incorrect." };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toPublicError(error).message };
  }
}

export async function signupAction(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  try {
    await limit("signup", parsed.data.email);
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { ok: false, error: "Sign-up is not configured yet." };
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${siteUrl()}/auth/callback`,
        data: { display_name: parsed.data.displayName, username: parsed.data.username },
      },
    });
    if (error) return { ok: false, error: "Could not create the account. Try a different email." };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toPublicError(error).message };
  }
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/");
}

export async function resetAction(input: unknown): Promise<{ ok: true; devLink?: string } | { ok: false; error: string }> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid email." };
  try {
    await limit("reset", parsed.data.email);
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { ok: false, error: "Password reset is not configured yet." };
    await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${siteUrl()}/auth/update-password` });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toPublicError(error).message };
  }
}

export async function updatePasswordAction(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Use at least 8 characters." };
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { ok: false, error: "Password update is not configured yet." };
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return { ok: false, error: "Open the reset link again and choose a new password." };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toPublicError(error).message };
  }
}

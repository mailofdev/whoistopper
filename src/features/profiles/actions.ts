"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth/session";
import { toPublicError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/rate-limit";
import { getServices } from "@/lib/services";
import { contactSchema, profileSchema } from "@/lib/validation/schemas";

export async function contactAction(input: unknown) {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const limit = rateLimit(`contact:${parsed.data.email}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return { ok: false as const, error: "Too many messages. Try again later." };
  try {
    await getServices().contact.send(parsed.data);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function updateProfileAction(input: unknown) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in to update your profile." };
  try {
    await getServices().profiles.update(user, { ...parsed.data, website: parsed.data.website || undefined });
    revalidatePath("/dashboard/settings");
    revalidatePath(`/u/${parsed.data.username}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function deleteAccountAction(confirmation: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in to delete your account." };
  if (confirmation !== user.email) return { ok: false as const, error: "Type your email to confirm deletion." };
  try {
    await getServices().profiles.deleteAccount(user, confirmation);
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
  const { logoutAction } = await import("@/features/auth/actions");
  await logoutAction();
  return { ok: true as const };
}

export async function markNotificationReadAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in required." };
  await getServices().notifications.markRead(user.id, id);
  revalidatePath("/dashboard/notifications");
  return { ok: true as const };
}

export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in required." };
  await getServices().notifications.markAllRead(user.id);
  revalidatePath("/dashboard/notifications");
  return { ok: true as const };
}

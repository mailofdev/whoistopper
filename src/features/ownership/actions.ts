"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth/session";
import { toPublicError } from "@/lib/errors";
import { getServices } from "@/lib/services";

export async function startEmailVerificationAction(productId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in to verify ownership." };
  try {
    const claim = await getServices().verification.startEmail(user, productId);
    revalidatePath("/dashboard/verification");
    return { ok: true as const, devLink: claim.devLink };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function startDomainVerificationAction(productId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in to verify ownership." };
  try {
    const claim = await getServices().verification.startDomain(user, productId);
    revalidatePath("/dashboard/verification");
    return { ok: true as const, token: claim.token, host: claim.host };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function checkDomainAction(productId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in to verify ownership." };
  try {
    await getServices().verification.checkDomain(user, productId);
    revalidatePath("/dashboard/verification");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function simulateDomainAction(productId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in to verify ownership." };
  try {
    await getServices().verification.simulateDomain(user, productId);
    revalidatePath("/dashboard/verification");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function confirmEmailTokenAction(token: string) {
  try {
    await getServices().verification.confirmEmail(token);
    revalidatePath("/dashboard/verification");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

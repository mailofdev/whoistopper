"use server";

import { revalidatePath } from "next/cache";
import { assertSandboxAllowed } from "@/features/payments/runtime";
import { getCurrentUser } from "@/features/auth/session";
import { toPublicError } from "@/lib/errors";
import { getServices } from "@/lib/services";
import { rupeesToPaise } from "@/lib/money";
import { upgradeSchema } from "@/lib/validation/schemas";
import type { ScopeType } from "@/types/domain";

export async function previewUpgradeAction(input: unknown) {
  const parsed = upgradeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Enter a valid amount." };
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Sign in to preview a rank." };
    const preview = await getServices().leaderboards.preview(
      user,
      parsed.data.productId,
      parsed.data.scope,
      rupeesToPaise(parsed.data.amountRupees),
    );
    return { ok: true as const, preview };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function createUpgradeAction(input: unknown) {
  const parsed = upgradeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Enter a valid amount." };
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Sign in to pay for a rank." };
    const supplied = typeof input === "object" && input && "idempotencyKey" in input
      ? String((input as { idempotencyKey?: string }).idempotencyKey ?? "")
      : "";
    const idempotencyKey = /^[0-9a-f-]{36}$/i.test(supplied) ? supplied : crypto.randomUUID();
    const order = await getServices().payments.createRankingOrder(
      user,
      parsed.data.productId,
      parsed.data.scope as ScopeType,
      rupeesToPaise(parsed.data.amountRupees),
      idempotencyKey,
    );
    revalidatePath("/leaderboard");
    return { ok: true as const, order };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function sandboxOutcomeAction(orderId: string, outcome: "success" | "failed" | "cancelled") {
  try {
    assertSandboxAllowed();
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Sign in to complete a test payment." };
    const result = await getServices().payments.sandboxComplete(user, orderId, outcome);
    revalidatePath("/leaderboard");
    revalidatePath("/leaderboard/today");
    return { ok: true as const, result };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function cancelOrderAction(orderId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Sign in to cancel a payment." };
    await getServices().payments.cancel(user, orderId);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

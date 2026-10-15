"use server";

import { revalidatePath } from "next/cache";
import { AppError, toPublicError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/rate-limit";
import { getServices } from "@/lib/services";
import { parseProductInput } from "@/lib/validation/product";
import { productSchema, reportSchema } from "@/lib/validation/schemas";
import { getCurrentUser } from "@/features/auth/session";

export async function saveProductAction(input: unknown, productId?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Sign in to manage a listing." };
    const limit = rateLimit(`product:${user.id}`, 10, 60 * 60 * 1000);
    if (!limit.ok) return { ok: false as const, error: "Too many listing changes. Try again later." };
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the form." };
    const services = getServices();
    const product = productId
      ? await services.products.update(user, productId, parseProductInput(parsed.data))
      : await services.products.create(user, parseProductInput(parsed.data));
    revalidatePath("/");
    revalidatePath("/search");
    return { ok: true as const, id: product.id, status: product.status };
  } catch (error) {
    if (error instanceof AppError) return { ok: false as const, error: error.message };
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function reportAction(input: unknown) {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Add a few more details." };
  try {
    const { getCurrentUser } = await import("@/features/auth/session");
    const user = await getCurrentUser();
    const key = user?.id ?? "anon";
    const limit = rateLimit(`report:${key}`, 5, 60 * 60 * 1000);
    if (!limit.ok) return { ok: false as const, error: "Too many reports. Try again later." };
    await getServices().reports.create(user, parsed.data);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

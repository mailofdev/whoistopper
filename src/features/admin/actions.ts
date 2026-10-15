"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/session";
import { toPublicError } from "@/lib/errors";
import { getServices } from "@/lib/services";
import { moderationSchema, roleSchema, settingsSchema } from "@/lib/validation/schemas";
import type { ProductStatus, UserRole } from "@/types/domain";

export async function moderateProductAction(input: unknown) {
  const parsed = moderationSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Choose a valid status." };
  try {
    const actor = await requireAdmin();
    await getServices().products.setStatus(actor, parsed.data.productId, parsed.data.status as ProductStatus, parsed.data.reason);
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function setRoleAction(input: unknown) {
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Choose a valid role." };
  try {
    const actor = await requireAdmin();
    await getServices().profiles.setRole(actor, parsed.data.userId, parsed.data.role as UserRole);
    revalidatePath("/admin/users");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function decideReportAction(reportId: string, decision: "resolved" | "dismissed", notes: string) {
  try {
    const actor = await requireAdmin();
    await getServices().reports.decide(actor, reportId, decision, notes);
    revalidatePath("/admin/reports");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function updateSettingsAction(input: unknown) {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the settings." };
  try {
    const actor = await requireAdmin();
    await getServices().admin.updateSettings(actor, parsed.data);
    revalidatePath("/admin/settings");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function setSponsoredAction(productId: string, days: number, active: boolean) {
  try {
    const actor = await requireAdmin();
    await getServices().admin.setSponsored(actor, productId, days, active);
    revalidatePath("/admin/placements");
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

export async function saveCategoryAction(input: {
  id?: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}) {
  try {
    const actor = await requireAdmin();
    await getServices().categories.save(actor, input);
    revalidatePath("/admin/categories");
    revalidatePath("/categories");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error).message };
  }
}

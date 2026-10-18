"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { assertPermittedCopy, fieldsFor, isActiveFieldSet, sanitizeDetails } from "@/config/catalogue";
import { openPackageCheckout } from "@/features/payments/packages";
import { readListingImage } from "@/features/listings/media";
import { newToken, sha256 } from "@/lib/security/hash";
import { rateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { normalizeWebsiteUrl, slugify } from "@/lib/urls";

type ListingResult =
  | { ok: true; managePath: string; checkoutHref?: string; warning?: string }
  | { ok: false; error: string };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function socialLinks(formData: FormData) {
  const links: Record<string, string> = {};
  for (const key of ["x", "instagram", "linkedin", "youtube"] as const) {
    const value = text(formData, `social_${key}`);
    if (!value) continue;
    links[key] = normalizeWebsiteUrl(value);
  }
  return links;
}

async function uploadImage(formData: FormData): Promise<string | null> {
  const image = await readListingImage(formData.get("image"));
  if (!image) return null;
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Image uploads need the directory database.");
  const path = `listings/${crypto.randomUUID()}.${image.ext}`;
  const uploaded = await admin.storage.from("listing-media").upload(path, image.bytes, { contentType: image.mime, upsert: false });
  if (uploaded.error) throw new Error("The image could not be stored. You can submit without one.");
  const { data } = admin.storage.from("listing-media").getPublicUrl(path);
  return data.publicUrl || null;
}

async function limiter(kind: string) {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return rateLimit(`${kind}:${sha256(ip).slice(0, 16)}`, 8, 60 * 60 * 1000);
}

export async function submitListingAction(formData: FormData): Promise<ListingResult> {
  const limit = await limiter("listing");
  if (!limit.ok) return { ok: false, error: "Too many submissions. Try again later." };
  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, error: "The directory database is not connected, so this listing cannot be saved yet." };

  try {
    const name = text(formData, "name");
    const shortDescription = text(formData, "shortDescription");
    const fullDescription = text(formData, "fullDescription");
    const creatorName = text(formData, "creatorName") || "Public listing";
    const categorySlug = text(formData, "categorySlug");
    const placement = text(formData, "placement");
    if (name.length < 2 || name.length > 80) return { ok: false, error: "Add a title between 2 and 80 characters." };
    if (shortDescription.length < 12 || shortDescription.length > 160) return { ok: false, error: "Add a short description between 12 and 160 characters." };
    if (fullDescription.length < 12 || fullDescription.length > 5000) return { ok: false, error: "Add a description between 12 and 5000 characters." };
    if (creatorName.length > 80) return { ok: false, error: "The display name is too long." };
    let websiteUrl: string;
    try {
      websiteUrl = normalizeWebsiteUrl(text(formData, "websiteUrl"));
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Enter a public URL." };
    }

    if (text(formData, "authorized") !== "on") return { ok: false, error: "Confirm that you own this destination or are allowed to promote it." };
    if (text(formData, "termsAccepted") !== "on") return { ok: false, error: "Accept the Terms, advertising rules, and Privacy Policy." };
    const category = await admin.from("categories").select("id, field_set, slug").eq("slug", categorySlug).eq("is_active", true).maybeSingle();
    if (!category.data || !isActiveFieldSet(String(category.data.field_set))) return { ok: false, error: "Choose a category." };
    const fieldSet = String(category.data.field_set);
    const detailInput: Record<string, string> = {};
    for (const field of fieldsFor(fieldSet)) detailInput[field.key] = text(formData, `detail_${field.key}`);
    const details = sanitizeDetails(fieldSet, detailInput);
    details.authorization = "confirmed";
    assertPermittedCopy(fieldSet, [name, shortDescription, fullDescription, ...Object.values(details)]);
    const links = socialLinks(formData);
    const packageSlug = placement === "paid" ? text(formData, "packageSlug") : "";
    const contactEmail = text(formData, "contactEmail");
    if (packageSlug && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return { ok: false, error: "Add a contact email so we can reach you about this campaign." };
    }
    const logoUrl = await uploadImage(formData);

    const duplicate = await admin.from("products").select("id").eq("normalized_url", websiteUrl).maybeSingle();
    if (duplicate.data) return { ok: false, error: "This public link is already listed. Use the private manage link if you created it, or report the listing if it is not yours." };

    const settings = await admin.from("platform_settings").select("value").eq("key", "moderation").maybeSingle();
    const hold = (settings.data?.value as { holdNewListingsForReview?: boolean } | null)?.holdNewListingsForReview !== false;
    const token = newToken();
    const inserted = await admin.from("products").insert({
      slug: `${slugify(name)}-${crypto.randomUUID().slice(0, 8)}`,
      name,
      website_url: websiteUrl,
      normalized_url: websiteUrl,
      short_description: shortDescription,
      full_description: fullDescription,
      logo_url: logoUrl,
      category_id: category.data.id,
      creator_name: creatorName,
      social_links: links,
      details,
      status: hold ? "pending_review" : "approved",
      approved_at: hold ? null : new Date().toISOString(),
      ownership_verified: false,
    }).select("id, slug").single();
    if (inserted.error || !inserted.data) {
      if (inserted.error?.code === "23505") return { ok: false, error: "This public link is already listed." };
      return { ok: false, error: "Could not save this listing." };
    }

    const credential = await admin.from("listing_manage_tokens").insert({ product_id: inserted.data.id, token_hash: sha256(token) });
    if (credential.error) return { ok: false, error: "The listing was saved, but the private link could not be created. Contact support with the public URL." };

    let checkoutHref: string | undefined;
    let warning: string | undefined;
    if (contactEmail) {
      await admin.from("listing_contacts").upsert({ product_id: inserted.data.id, email: contactEmail });
    }
    if (packageSlug) {
      const clientPrice = Number(text(formData, "clientPricePaise"));
      const bid = await openPackageCheckout({
        productId: inserted.data.id,
        packageSlug,
        categoryId: category.data.id,
        clientPricePaise: Number.isInteger(clientPrice) ? clientPrice : undefined,
      });
      if (!bid.ok) warning = `The listing is saved. ${bid.error}`;
      else checkoutHref = bid.href;
    }

    revalidatePath("/");
    revalidatePath("/categories");
    return { ok: true, managePath: `/manage/${token}`, checkoutHref, warning };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save this listing." };
  }
}

async function listingForToken(token: string) {
  const admin = createSupabaseAdminClient();
  if (!admin || token.length < 20 || token.length > 120) return null;
  const row = await admin.from("listing_manage_tokens").select("product_id, revoked_at").eq("token_hash", sha256(token)).maybeSingle();
  if (!row.data || row.data.revoked_at) return null;
  const product = await admin.from("products").select("id, slug, name, website_url, short_description, full_description, category_id, creator_name, social_links, details, status, logo_url, categories(slug, field_set)").eq("id", row.data.product_id).maybeSingle();
  return product.data ? { admin, product: product.data } : null;
}

export async function loadManagedListing(token: string) {
  const found = await listingForToken(token);
  if (!found) return null;
  const product = found.product as Record<string, unknown>;
  const category = Array.isArray(product.categories) ? product.categories[0] : product.categories;
  const categoryRow = category as { slug?: string; field_set?: string } | null;
  return {
    id: String(product.id),
    name: String(product.name),
    websiteUrl: String(product.website_url),
    shortDescription: String(product.short_description),
    fullDescription: String(product.full_description),
    creatorName: String(product.creator_name),
    categorySlug: categoryRow?.slug ?? "",
    fieldSet: categoryRow?.field_set ?? "",
    details: (product.details as Record<string, string> | null) ?? {},
    socialLinks: (product.social_links as Record<string, string> | null) ?? {},
    status: String(product.status),
    logoUrl: (product.logo_url as string | null) ?? null,
  };
}

export async function updateManagedListingAction(formData: FormData): Promise<ListingResult> {
  const limit = await limiter("manage");
  if (!limit.ok) return { ok: false, error: "Too many changes. Try again later." };
  const token = text(formData, "token");
  const found = await listingForToken(token);
  if (!found) return { ok: false, error: "This private link is not valid." };
  try {
    const name = text(formData, "name");
    const shortDescription = text(formData, "shortDescription");
    const fullDescription = text(formData, "fullDescription");
    if (name.length < 2 || name.length > 80) return { ok: false, error: "Add a title between 2 and 80 characters." };
    if (shortDescription.length < 12 || shortDescription.length > 160) return { ok: false, error: "Add a short description between 12 and 160 characters." };
    if (fullDescription.length < 12 || fullDescription.length > 5000) return { ok: false, error: "Add a description between 12 and 5000 characters." };
    const websiteUrl = normalizeWebsiteUrl(text(formData, "websiteUrl"));
    const fieldSet = text(formData, "fieldSet");
    if (!isActiveFieldSet(fieldSet)) return { ok: false, error: "This category is not open for changes." };
    if (text(formData, "authorized") !== "on") return { ok: false, error: "Confirm that you own this destination or are allowed to promote it." };
    const detailInput: Record<string, string> = {};
    for (const field of fieldsFor(fieldSet)) detailInput[field.key] = text(formData, `detail_${field.key}`);
    const details = sanitizeDetails(fieldSet, detailInput);
    details.authorization = "confirmed";
    const links = socialLinks(formData);
    const logoUrl = await uploadImage(formData);
    const current = found.product as { id: string; slug: string; logo_url: string | null; website_url: string; status: string };
    if (current.status === "removed") return { ok: false, error: "This listing was removed." };
    const clash = await found.admin.from("products").select("id").eq("normalized_url", websiteUrl).neq("id", current.id).maybeSingle();
    if (clash.data) return { ok: false, error: "Another listing already uses that public link." };
    const patch: Record<string, unknown> = {
      name,
      website_url: websiteUrl,
      normalized_url: websiteUrl,
      short_description: shortDescription,
      full_description: fullDescription,
      creator_name: text(formData, "creatorName").slice(0, 80) || "Public listing",
      social_links: links,
      details,
      logo_url: logoUrl || current.logo_url,
    };
    if (current.website_url !== websiteUrl) {
      patch.ownership_verified = false;
      patch.status = "pending_review";
    }
    const { error } = await found.admin.from("products").update(patch).eq("id", current.id);
    if (error) return { ok: false, error: "Could not update this listing." };
    revalidatePath(`/products/${current.slug}`);
    return { ok: true, managePath: `/manage/${token}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update this listing." };
  }
}

export async function rotateManageLinkAction(formData: FormData): Promise<ListingResult> {
  const token = text(formData, "token");
  const found = await listingForToken(token);
  if (!found) return { ok: false, error: "This private link is not valid." };
  const next = newToken();
  const product = found.product as { id: string };
  const { error } = await found.admin.from("listing_manage_tokens").update({ token_hash: sha256(next), revoked_at: null }).eq("product_id", product.id);
  if (error) return { ok: false, error: "Could not replace the private link." };
  return { ok: true, managePath: `/manage/${next}` };
}

export async function revokeManageLinkAction(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = text(formData, "token");
  const found = await listingForToken(token);
  if (!found) return { ok: false, error: "This private link is not valid." };
  const product = found.product as { id: string };
  const { error } = await found.admin.from("listing_manage_tokens").update({ revoked_at: new Date().toISOString() }).eq("product_id", product.id);
  if (error) return { ok: false, error: "Could not revoke the private link." };
  return { ok: true };
}

export async function removeManagedListingAction(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = text(formData, "token");
  const found = await listingForToken(token);
  if (!found) return { ok: false, error: "This private link is not valid." };
  const product = found.product as { id: string; slug: string };
  const removed = await found.admin.from("products").update({ status: "removed" }).eq("id", product.id);
  if (removed.error) return { ok: false, error: "Could not remove this listing." };
  await found.admin.from("ranking_placements").update({ status: "superseded" }).eq("product_id", product.id).eq("status", "active");
  await found.admin.from("ad_campaigns").update({ status: "cancelled" }).eq("product_id", product.id).in("status", ["active", "scheduled"]);
  await found.admin.from("listing_manage_tokens").update({ revoked_at: new Date().toISOString() }).eq("product_id", product.id);
  revalidatePath("/");
  revalidatePath(`/products/${product.slug}`);
  return { ok: true };
}

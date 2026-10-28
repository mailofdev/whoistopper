import { z } from "zod";
import { PRODUCT_STATUSES } from "@/types/domain";

const socialUrl = z
  .string()
  .trim()
  .max(300)
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined)
  .refine((value) => !value || /^https:\/\/[^\s]+$/.test(value), "Social links must be https URLs.");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email.").max(200),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
});

export const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Use at least 2 characters.").max(80, "Use 80 characters or fewer."),
  username: z
    .string()
    .trim()
    .min(3, "Use at least 3 characters.")
    .max(24, "Use 24 characters or fewer.")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores."),
  email: z.string().trim().email("Enter a valid email.").max(200),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
});

export const resetSchema = z.object({
  email: z.string().trim().email().max(200),
});

export const passwordSchema = z.object({
  password: z.string().min(8).max(200),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(80),
  websiteUrl: z.string().trim().min(4).max(300),
  shortDescription: z.string().trim().min(12).max(160),
  fullDescription: z.string().trim().min(12).max(5000),
  categorySlug: z.string().trim().min(2).max(40),
  tags: z.array(z.string().trim().min(2).max(24)).max(8),
  creatorName: z.string().trim().min(2).max(80),
  logoUrl: z.string().trim().url().optional().or(z.literal("")),
  socialLinks: z
    .object({
      x: socialUrl,
      linkedin: socialUrl,
      instagram: socialUrl,
      youtube: socialUrl,
      twitch: socialUrl,
      kick: socialUrl,
    })
    .default({}),
  submit: z.boolean(),
  details: z.record(z.string().max(500)).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(2000),
});

export const reportSchema = z.object({
  productId: z.string().uuid(),
  reason: z.enum(["inaccurate", "prohibited", "impersonation", "malware", "spam", "other"]),
  details: z.string().trim().min(10).max(2000),
});

export const upgradeSchema = z.object({
  productId: z.string().uuid(),
  packageSlug: z.enum(["daily-featured", "weekly-featured", "weekly-category-sponsor"]),
  clientPricePaise: z.number().int().positive().optional(),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  username: z.string().trim().min(3).max(24).regex(/^[a-z0-9_]+$/),
  bio: z.string().trim().max(280),
  website: z.string().trim().max(300).optional().or(z.literal("")),
});

export const moderationSchema = z.object({
  productId: z.string().uuid(),
  status: z.enum(PRODUCT_STATUSES),
  reason: z.string().trim().max(500).optional(),
});

export const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["user", "admin", "super_admin"]),
});

export const settingsSchema = z.object({
  dailyFeaturedPricePaise: z.number().int().positive(),
  weeklyFeaturedPricePaise: z.number().int().positive(),
  categorySponsorPricePaise: z.number().int().positive(),
  holdNewListingsForReview: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProductFormInput = z.infer<typeof productSchema>;

import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  NEXT_PUBLIC_SITE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_USE_MOCK_DATA: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  CASHFREE_CLIENT_ID: z.string().optional(),
  CASHFREE_CLIENT_SECRET: z.string().optional(),
  CASHFREE_WEBHOOK_SECRET: z.string().optional(),
  PAYMENT_MODE: z.enum(["sandbox", "live"]).optional(),
  ANALYTICS_SALT: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  REQUIRE_ADMIN_MFA: z.enum(["true", "false"]).optional(),
  SENTRY_DSN: optionalUrl,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function readServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const parsed = serverEnvSchema.safeParse(source);
  if (!parsed.success) {
    const issue = parsed.error.issues.map((item) => item.path.join(".")).join(", ");
    throw new Error(`Invalid environment configuration: ${issue}`);
  }
  return parsed.data;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string | null;
}

export function readSupabaseConfig(env: ServerEnv = readServerEnv()): SupabaseConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return {
    url,
    anonKey,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || null,
  };
}

export interface PaymentKeyConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

export function readRazorpayConfig(env: ServerEnv = readServerEnv()): PaymentKeyConfig | null {
  const keyId = env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
  if (!keyId || !keySecret || !webhookSecret) return null;
  return { keyId, keySecret, webhookSecret };
}

export function configurationGaps(env: ServerEnv = readServerEnv()): string[] {
  const gaps: string[] = [];
  if (env.NODE_ENV === "production" && env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
    gaps.push("Mock data was requested but is disabled because NODE_ENV is production.");
  }
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    gaps.push("Supabase URL or anon key is not set.");
  }
  if (env.NODE_ENV === "production" && !env.SUPABASE_SERVICE_ROLE_KEY) {
    gaps.push("SUPABASE_SERVICE_ROLE_KEY is not set. Webhooks and admin maintenance cannot run.");
  }
  if (env.NODE_ENV === "production" && !readRazorpayConfig(env)) {
    gaps.push("Razorpay live keys are not set. Checkout is unavailable.");
  }
  if (env.NODE_ENV === "production" && !env.ANALYTICS_SALT) {
    gaps.push("ANALYTICS_SALT is not set. View and click recording is paused.");
  }
  if (env.NODE_ENV === "production" && !env.CRON_SECRET) {
    gaps.push("CRON_SECRET is not set. The daily snapshot route will reject calls.");
  }
  return gaps;
}

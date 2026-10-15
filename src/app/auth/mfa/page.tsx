import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Administrator verification", "Additional verification is required.", "/auth/mfa", false);

export default function MfaPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-semibold">Additional verification</h1>
      <p className="mt-3 text-sm leading-6 text-secondary">Administrator tools in production require a second factor through Supabase Auth (authenticator assurance level aal2). Enroll an authenticator in the Supabase dashboard, sign in again, and complete the challenge before opening admin pages. Development mock administrators are marked as already verified.</p>
    </div>
  );
}


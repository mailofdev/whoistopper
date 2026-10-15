import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Verify email", "Confirm your email address.", "/auth/verify", false);

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-semibold">Check your email</h1>
      <p className="mt-3 text-sm leading-6 text-secondary">Open the verification link to finish creating the account. In development mock mode, new accounts are already signed in and this step is informational. With Supabase, the link returns to the auth callback.</p>
    </div>
  );
}


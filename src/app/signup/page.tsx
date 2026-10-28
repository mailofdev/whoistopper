import Link from "next/link";
import { SignupForm } from "@/features/auth/auth-forms";
import { pageMetadata } from "@/lib/metadata";
import { Card } from "@/components/ui/primitives";

export const metadata = pageMetadata("Create account", "Create an account to keep creator profiles in your studio.", "/signup", false);

export default function SignupPage() {
  return (
    <Card className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <p className="mt-2 text-sm text-secondary">The account is for your studio. A public profile can still be launched without one.</p>
      <div className="mt-6"><SignupForm /></div>
      <p className="mt-4 text-sm text-secondary">Already registered? <Link className="font-semibold text-brand" href="/login">Sign in</Link></p>
    </Card>
  );
}

import Link from "next/link";
import { LoginForm } from "@/features/auth/auth-forms";
import { pageMetadata } from "@/lib/metadata";
import { Card } from "@/components/ui/primitives";

export const metadata = pageMetadata("Sign in", "Sign in to manage your creator profile, payments, and studio.", "/login", false);

export default function LoginPage() {
  return (
    <Card className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-sm text-secondary">You can launch a free profile without an account. Sign in to keep it in your studio.</p>
      <div className="mt-6">
        <LoginForm demo={null} />
      </div>
      <p className="mt-4 text-sm text-secondary">
        <Link className="font-semibold text-brand" href="/signup">Create an account</Link>
        {" · "}
        <Link className="font-semibold text-brand" href="/auth/reset">Forgot password</Link>
      </p>
    </Card>
  );
}

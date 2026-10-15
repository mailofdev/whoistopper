import { ResetForm } from "@/features/auth/account-forms";
import { Card } from "@/components/ui/primitives";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Reset password", "Request a password reset link.", "/auth/reset", false);

export default function ResetPage() {
  return <Card className="mx-auto max-w-md"><h1 className="text-2xl font-semibold">Reset password</h1><div className="mt-6"><ResetForm /></div></Card>;
}


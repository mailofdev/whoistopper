import { Suspense } from "react";
import { PasswordForm } from "@/features/auth/account-forms";
import { Card, Skeleton } from "@/components/ui/primitives";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Choose a password", "Set a new password.", "/auth/update-password", false);

export default function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-40" />}>
      <Form searchParams={searchParams} />
    </Suspense>
  );
}

async function Form({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <Card className="mx-auto max-w-md"><h1 className="text-2xl font-semibold">Choose a new password</h1><div className="mt-6"><PasswordForm token={token} /></div></Card>;
}


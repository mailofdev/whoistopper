import { Suspense } from "react";
import { confirmEmailTokenAction } from "@/features/ownership/actions";
import { Alert, PageHeader, Skeleton } from "@/components/ui/primitives";

export const metadata = { robots: { index: false, follow: false } };

export default function VerifyOwnershipPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  return <Suspense fallback={<Skeleton className="h-32" />}><Confirm searchParams={searchParams} /></Suspense>;
}

async function Confirm({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) return <Alert>This verification link is missing its token.</Alert>;
  const result = await confirmEmailTokenAction(token);
  return result.ok
    ? <PageHeader title="Ownership verified" description="The listing can move to review, or go live if review is turned off." />
    : <Alert>{result.error}</Alert>;
}


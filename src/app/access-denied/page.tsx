import Link from "next/link";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Access denied", "You cannot open this page.", "/access-denied", false);

export default function AccessDeniedPage() {
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <h1 className="text-3xl font-semibold">Access denied</h1>
      <p className="mt-3 text-sm text-secondary">Your account does not have permission for that page.</p>
      <Link className="mt-6 inline-flex font-semibold text-brand" href="/">Go home</Link>
    </div>
  );
}


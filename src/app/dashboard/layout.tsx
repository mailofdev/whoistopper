import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/features/auth/session";
import { Skeleton } from "@/components/ui/primitives";

export const metadata = { robots: { index: false, follow: false } };

const links = [
  ["/dashboard", "Overview"],
  ["/dashboard/products", "Listings"],
  ["/dashboard/verification", "Verification"],
  ["/dashboard/payments", "Payments"],
  ["/dashboard/analytics", "Analytics"],
  ["/dashboard/notifications", "Notifications"],
  ["/dashboard/settings", "Settings"],
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Skeleton className="h-40" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <nav aria-label="Account" className="flex gap-2 overflow-auto md:flex-col">
        {links.map(([href, label]) => (
          <Link key={href} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted" href={href}>{label}</Link>
        ))}
      </nav>
      <div>
        <p className="mb-4 text-sm text-secondary">Signed in as {user.displayName}</p>
        {children}
      </div>
    </div>
  );
}

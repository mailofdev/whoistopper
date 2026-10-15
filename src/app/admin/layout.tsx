import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/features/auth/session";
import { Skeleton } from "@/components/ui/primitives";

export const metadata = { robots: { index: false, follow: false } };

const links = [
  ["/admin", "Overview"],
  ["/admin/products", "Products"],
  ["/admin/users", "Users"],
  ["/admin/categories", "Categories"],
  ["/admin/reports", "Reports"],
  ["/admin/payments", "Payments"],
  ["/admin/webhooks", "Webhooks"],
  ["/admin/placements", "Sponsored"],
  ["/admin/audit", "Audit"],
  ["/admin/settings", "Settings"],
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Skeleton className="h-40" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <nav aria-label="Administration" className="flex gap-2 overflow-auto md:flex-col">
        {links.map(([href, label]) => (
          <Link key={href} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted" href={href}>{label}</Link>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { assertSandboxAllowed } from "@/features/payments/runtime";
import { SandboxPanel } from "@/features/payments/sandbox-panel";
import { requireUser } from "@/features/auth/session";
import { Alert, Card, PageHeader } from "@/components/ui/primitives";
import { formatInrFromPaise } from "@/lib/money";
import { getServices } from "@/lib/services";

export const metadata = { robots: { index: false, follow: false } };

export default async function SandboxPage({ params }: { params: Promise<{ orderId: string }> }) {
  const user = await requireUser();
  const { orderId } = await params;
  const order = await getServices().payments.getForUser(user.id, orderId);
  if (!order) notFound();
  let allowed = true;
  try { assertSandboxAllowed(); } catch { allowed = false; }
  return (
    <Card className="mx-auto max-w-xl">
      <PageHeader title="Test payment" description={`${order.productName} · ${formatInrFromPaise(order.amountPaise)} · preview rank ${order.quotedRank ?? "—"}`} />
      {allowed ? <SandboxPanel orderId={order.id} /> : <Alert>Live or unconfigured payments cannot be completed on this page. Finish checkout with the payment provider.</Alert>}
    </Card>
  );
}


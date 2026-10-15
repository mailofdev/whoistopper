import { notFound } from "next/navigation";
import { assertSandboxAllowed } from "@/features/payments/runtime";
import { SandboxPanel } from "@/features/payments/sandbox-panel";
import { Alert, Card, PageHeader } from "@/components/ui/primitives";
import { formatInrFromPaise } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";

export const metadata = { robots: { index: false, follow: false } };

export default async function SandboxPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const admin = createSupabaseAdminClient();
  if (!admin) notFound();
  const loaded = await admin.from("payment_orders").select("id, amount_paise, products(name)").eq("id", orderId).maybeSingle();
  if (!loaded.data) notFound();
  const product = loaded.data.products as { name?: string } | { name?: string }[] | null;
  const name = Array.isArray(product) ? product[0]?.name : product?.name;
  let allowed = true;
  try { assertSandboxAllowed(); } catch { allowed = false; }
  return (
    <Card className="mx-auto max-w-xl">
      <PageHeader title="Test payment" description={`${name ?? "Product"} · ${formatInrFromPaise(Number(loaded.data.amount_paise))}. This page does not charge a bank or UPI app.`} />
      {allowed ? <SandboxPanel orderId={loaded.data.id} /> : <Alert>Live or unconfigured payments cannot be completed on this page. Finish checkout with the payment provider.</Alert>}
    </Card>
  );
}

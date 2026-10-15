import { notFound } from "next/navigation";
import { RazorpayCheckout } from "@/features/payments/razorpay-checkout";
import { Card, PageHeader } from "@/components/ui/primitives";
import { readRazorpayConfig } from "@/config/env";
import { formatInrFromPaise } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";

export const metadata = { robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const keys = readRazorpayConfig();
  const admin = createSupabaseAdminClient();
  if (!keys || !admin) notFound();
  const loaded = await admin.from("payment_orders").select("id, amount_paise, provider, provider_order_id, status, products(name)").eq("id", orderId).maybeSingle();
  if (!loaded.data || loaded.data.provider !== "razorpay" || !loaded.data.provider_order_id || loaded.data.status !== "pending") notFound();
  const product = loaded.data.products as { name?: string } | { name?: string }[] | null;
  const name = (Array.isArray(product) ? product[0]?.name : product?.name) ?? "Product";
  return (
    <Card className="mx-auto max-w-xl">
      <PageHeader title="Pay for this rank" description={`${name} · ${formatInrFromPaise(Number(loaded.data.amount_paise))}`} />
      <RazorpayCheckout keyId={keys.keyId} orderId={loaded.data.provider_order_id} amountPaise={Number(loaded.data.amount_paise)} name={name} />
    </Card>
  );
}

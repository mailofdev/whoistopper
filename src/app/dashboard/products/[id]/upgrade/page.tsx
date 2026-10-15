import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { UpgradeForm } from "@/features/payments/upgrade-form";
import { PageHeader } from "@/components/ui/primitives";
import { getServices } from "@/lib/services";

export default async function UpgradePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const product = await getServices().products.getManageable(user, id);
  if (!product || product.status !== "approved" || !product.ownershipVerified) notFound();
  return (
    <>
      <PageHeader title={`Upgrade ${product.name}`} description="The amount is stored on the server. A preview is not a reserved rank." />
      <UpgradeForm productId={product.id} />
    </>
  );
}


import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { UpgradeForm } from "@/features/payments/upgrade-form";
import { listAdPackages } from "@/features/payments/packages";
import { PageHeader } from "@/components/ui/primitives";
import { getServices } from "@/lib/services";

export default async function UpgradePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const product = await getServices().products.getManageable(user, id);
  if (!product || product.status !== "approved" || !product.ownershipVerified) notFound();
  return (
    <>
      <PageHeader title={`Advertise ${product.name}`} description="Packages have a fixed server price and a fixed duration. Paying more does not buy a higher place." />
      <UpgradeForm productId={product.id} packages={await listAdPackages()} />
    </>
  );
}


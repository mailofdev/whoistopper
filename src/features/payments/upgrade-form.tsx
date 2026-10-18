"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUpgradeAction } from "@/features/payments/actions";
import { formatInrFromPaise } from "@/lib/money";
import { Alert, Button, Field, SelectInput } from "@/components/ui/primitives";
import type { AdPackageDefinition } from "@/config/packages";

export function UpgradeForm({ productId, packages }: { productId: string; packages: AdPackageDefinition[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [packageSlug, setPackageSlug] = useState<string>(packages[0]?.slug ?? "");
  const [pending, setPending] = useState(false);
  const selected = packages.find((item) => item.slug === packageSlug) ?? packages[0];
  if (!selected) return <Alert>No advertising packages are available.</Alert>;

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        const result = await createUpgradeAction({ productId, packageSlug: selected.slug, clientPricePaise: selected.pricePaise });
        setPending(false);
        if (!result.ok) setError(result.error);
        else router.push(result.href);
      }}
    >
      {error ? <Alert>{error}</Alert> : null}
      <Field label="Package" hint="The charged price is the server price, not a number typed here.">
        <SelectInput value={selected.slug} onChange={(event) => setPackageSlug(event.target.value)}>
          {packages.map((item) => <option key={item.slug} value={item.slug}>{item.name} · {formatInrFromPaise(item.pricePaise)}</option>)}
        </SelectInput>
      </Field>
      <p className="text-sm leading-6 text-secondary">{selected.description}</p>
      <p className="text-sm leading-6 text-secondary">
        The confirmed start and end are stored in Asia/Kolkata time when payment is verified. This purchase does not change another advertiser&apos;s place.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Opening checkout…" : "Continue to payment"}</Button>
    </form>
  );
}

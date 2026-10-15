"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createUpgradeAction, previewUpgradeAction } from "@/features/payments/actions";
import { formatInrFromPaise } from "@/lib/money";
import { upgradeSchema } from "@/lib/validation/schemas";
import { Alert, Button, Field, SelectInput, TextInput } from "@/components/ui/primitives";
import type { UpgradePreview } from "@/types/domain";

export function UpgradeForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<UpgradePreview | null>(null);
  const form = useForm({
    resolver: zodResolver(upgradeSchema),
    defaultValues: { productId, scope: "all_time" as const, amountRupees: 99 },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setError("");
        const result = await createUpgradeAction({ ...values, idempotencyKey });
        if (!result.ok) setError(result.error);
        else router.push(`/payments/sandbox/${result.order.id}`);
      })}
    >
      {error ? <Alert>{error}</Alert> : null}
      {preview ? (
        <Alert tone="info">
          Preview only: {formatInrFromPaise(preview.amountPaise)} would currently sit at #{preview.quotedRank}. {preview.message} The final rank is assigned after payment is verified.
        </Alert>
      ) : null}
      <Field label="Board" error={form.formState.errors.scope?.message}>
        <SelectInput {...form.register("scope")}>
          <option value="all_time">All-time</option>
          <option value="daily">Today (UTC)</option>
          <option value="category">This category</option>
        </SelectInput>
      </Field>
      <Field label="Amount (INR)" hint="Minimum new bids start at the published floor. Existing bids must increase by at least the published step." error={form.formState.errors.amountRupees?.message}>
        <TextInput type="number" min={1} step="1" {...form.register("amountRupees", { valueAsNumber: true })} />
      </Field>
      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={async () => {
            setError("");
            const values = form.getValues();
            const result = await previewUpgradeAction(values);
            if (!result.ok) setError(result.error);
            else setPreview(result.preview);
          }}
        >
          Preview rank
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>Continue to payment</Button>
      </div>
    </form>
  );
}

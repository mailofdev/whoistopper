"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelOrderAction, sandboxOutcomeAction } from "@/features/payments/actions";
import { Alert, Button } from "@/components/ui/primitives";

export function SandboxPanel({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function run(outcome: "success" | "failed" | "cancelled") {
    setPending(true);
    setError("");
    const result = await sandboxOutcomeAction(orderId, outcome);
    setPending(false);
    if (!result.ok) setError(result.error);
    else router.push(`/dashboard/payments/${orderId}`);
  }

  return (
    <div className="space-y-3">
      {error ? <Alert>{error}</Alert> : null}
      <p className="text-sm text-secondary">This is a labelled test payment. It does not charge a bank or UPI app.</p>
      <div className="flex flex-wrap gap-3">
        <Button disabled={pending} onClick={() => void run("success")} type="button">Simulate success</Button>
        <Button disabled={pending} variant="secondary" onClick={() => void run("failed")} type="button">Simulate failure</Button>
        <Button
          disabled={pending}
          variant="ghost"
          onClick={async () => {
            setPending(true);
            const result = await cancelOrderAction(orderId);
            setPending(false);
            if (!result.ok) setError(result.error);
            else router.push("/dashboard/payments");
          }}
          type="button"
        >
          Cancel order
        </Button>
        <Button disabled={pending} variant="danger" onClick={() => void run("cancelled")} type="button">Simulate provider cancel</Button>
      </div>
    </div>
  );
}

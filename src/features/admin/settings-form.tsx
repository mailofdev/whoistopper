"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateSettingsAction } from "@/features/admin/actions";
import { settingsSchema } from "@/lib/validation/schemas";
import { Alert, Button, Field, TextInput } from "@/components/ui/primitives";
import type { PlatformSettings } from "@/types/domain";

export function SettingsForm({ defaults }: { defaults: PlatformSettings }) {
  const [message, setMessage] = useState("");
  const form = useForm({ resolver: zodResolver(settingsSchema), defaultValues: defaults });
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(async (values) => {
      const result = await updateSettingsAction(values);
      setMessage(result.ok ? "Settings saved." : result.error);
    })}>
      {message ? <Alert tone={message === "Settings saved." ? "success" : "error"}>{message}</Alert> : null}
      <Field label="Minimum rank amount (paise)"><TextInput type="number" {...form.register("minimumBidPaise", { valueAsNumber: true })} /></Field>
      <Field label="Minimum increase (paise)"><TextInput type="number" {...form.register("minimumIncrementPaise", { valueAsNumber: true })} /></Field>
      <Field label="Maximum rank amount (paise)"><TextInput type="number" {...form.register("maxBidPaise", { valueAsNumber: true })} /></Field>
      <Field label="Sponsored week (paise)"><TextInput type="number" {...form.register("sponsoredWeeklyPricePaise", { valueAsNumber: true })} /></Field>
      <Field label="Sponsored slots"><TextInput type="number" {...form.register("sponsoredMaxActive", { valueAsNumber: true })} /></Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" {...form.register("holdNewListingsForReview")} /> Hold new listings for review</label>
      <Button type="submit" disabled={form.formState.isSubmitting}>Save settings</Button>
    </form>
  );
}


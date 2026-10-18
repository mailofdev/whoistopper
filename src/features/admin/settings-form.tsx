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
      <Field label="Daily featured price (paise)" hint="Test price until the payment provider approves live charges."><TextInput type="number" {...form.register("dailyFeaturedPricePaise", { valueAsNumber: true })} /></Field>
      <Field label="Weekly featured price (paise)"><TextInput type="number" {...form.register("weeklyFeaturedPricePaise", { valueAsNumber: true })} /></Field>
      <Field label="Category sponsor price (paise)"><TextInput type="number" {...form.register("categorySponsorPricePaise", { valueAsNumber: true })} /></Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" {...form.register("holdNewListingsForReview")} /> Hold new listings for review</label>
      <Button type="submit" disabled={form.formState.isSubmitting}>Save settings</Button>
    </form>
  );
}


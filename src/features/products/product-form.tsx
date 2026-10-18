"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { fieldsFor } from "@/config/catalogue";
import { saveProductAction } from "@/features/products/actions";
import { productSchema } from "@/lib/validation/schemas";
import { Alert, Button, Field, SelectInput, TextArea, TextInput } from "@/components/ui/primitives";
import type { Category } from "@/types/domain";

export function ProductForm({
  categories,
  productId,
  defaults,
}: {
  categories: Category[];
  productId?: string;
  defaults?: {
    name: string;
    websiteUrl: string;
    shortDescription: string;
    fullDescription: string;
    categorySlug: string;
    tags: string;
    creatorName: string;
    details?: Record<string, string>;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: defaults?.name ?? "",
      websiteUrl: defaults?.websiteUrl ?? "",
      shortDescription: defaults?.shortDescription ?? "",
      fullDescription: defaults?.fullDescription ?? "",
      categorySlug: defaults?.categorySlug ?? categories[0]?.slug ?? "",
      tags: defaults?.tags ? defaults.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
      creatorName: defaults?.creatorName ?? "",
      logoUrl: "",
      socialLinks: {},
      submit: true,
      details: defaults?.details ?? {},
    },
  });
  const [categorySlug, setCategorySlug] = useState(defaults?.categorySlug ?? categories[0]?.slug ?? "");
  const fields = fieldsFor(categories.find((item) => item.slug === categorySlug)?.fieldSet ?? "");

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setError("");
        const result = await saveProductAction({ ...values, tags: values.tags }, productId);
        if (!result.ok) setError(result.error);
        else router.push(`/dashboard/products/${result.id}`);
      })}
    >
      {error ? <Alert>{error}</Alert> : null}
      <Field label="Product name" error={form.formState.errors.name?.message}>
        <TextInput {...form.register("name")} />
      </Field>
      <Field label="Website" hint="Use the public https address. Shorteners are blocked." error={form.formState.errors.websiteUrl?.message}>
        <TextInput inputMode="url" placeholder="https://example.com" {...form.register("websiteUrl")} />
      </Field>
      <Field label="Short description" error={form.formState.errors.shortDescription?.message}>
        <TextInput {...form.register("shortDescription")} />
      </Field>
      <Field label="Full description" error={form.formState.errors.fullDescription?.message}>
        <TextArea {...form.register("fullDescription")} />
      </Field>
      <Field label="Category" error={form.formState.errors.categorySlug?.message}>
        <SelectInput {...form.register("categorySlug", { onChange: (event) => setCategorySlug(event.target.value) })}>
          {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
        </SelectInput>
      </Field>
      {fields.map((field) => (
        <Field key={field.key} label={`${field.label}${field.required ? " (required)" : " (optional)"}`} hint={field.hint}>
          {field.kind === "select" ? (
            <SelectInput {...form.register(`details.${field.key}`)}>
              <option value="">Choose one</option>
              {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
            </SelectInput>
          ) : field.kind === "textarea" ? (
            <TextArea {...form.register(`details.${field.key}`)} />
          ) : (
            <TextInput {...form.register(`details.${field.key}`)} />
          )}
        </Field>
      ))}
      <Field label="Tags" hint="Comma-separated, up to 8." error={form.formState.errors.tags?.message}>
        <TextInput
          defaultValue={defaults?.tags ?? ""}
          onChange={(event) => {
            const tags = event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean);
            form.setValue("tags", tags, { shouldValidate: true });
          }}
        />
      </Field>
      <Field label="Creator name" error={form.formState.errors.creatorName?.message}>
        <TextInput {...form.register("creatorName")} />
      </Field>
      <div className="flex gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting} onClick={() => form.setValue("submit", true)}>Submit for review</Button>
        <Button type="submit" variant="secondary" disabled={form.formState.isSubmitting} onClick={() => form.setValue("submit", false)}>Save draft</Button>
      </div>
    </form>
  );
}

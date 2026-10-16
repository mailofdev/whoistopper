"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fieldsFor } from "@/config/catalogue";
import {
  removeManagedListingAction,
  revokeManageLinkAction,
  rotateManageLinkAction,
  submitListingAction,
  updateManagedListingAction,
} from "@/features/listings/actions";
import { Alert, Button, Field, SelectInput, TextArea, TextInput } from "@/components/ui/primitives";
import type { Category } from "@/types/domain";

export function ListingForm({ categories }: { categories: Category[] }) {
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? "");
  const [placement, setPlacement] = useState<"free" | "paid">("free");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState<{ managePath: string; checkoutHref?: string; warning?: string } | null>(null);
  const category = categories.find((item) => item.slug === categorySlug) ?? categories[0];
  const fields = useMemo(() => fieldsFor(category?.fieldSet ?? "website"), [category?.fieldSet]);
  const groups = [...new Map(categories.map((item) => [item.groupSlug, item.groupName])).entries()];

  if (saved) {
    return (
      <div className="glass space-y-4 rounded-3xl p-5">
        <h2 className="text-xl font-semibold">Listing saved</h2>
        <p className="text-sm leading-6 text-secondary">This private link is the only way to edit the listing. It is not shown on the public page. Store it now. Replacing or revoking it makes this address stop working.</p>
        {saved.warning ? <Alert tone="info">{saved.warning}</Alert> : null}
        <p className="break-all rounded-2xl bg-muted px-3 py-3 text-sm"><Link className="font-semibold text-brand" href={saved.managePath}>Open the private manage link</Link></p>
        {saved.checkoutHref ? <Link className="inline-flex h-11 items-center rounded-full bg-brand px-4 text-sm font-semibold text-on-brand" href={saved.checkoutHref}>Continue to payment</Link> : null}
      </div>
    );
  }

  return (
    <form
      className="glass space-y-4 rounded-3xl p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        const result = await submitListingAction(new FormData(event.currentTarget));
        setPending(false);
        if (!result.ok) setError(result.error);
        else setSaved({ managePath: result.managePath, checkoutHref: result.checkoutHref, warning: result.warning });
      }}
    >
      {error ? <Alert>{error}</Alert> : null}
      <Field label="Category">
        <SelectInput name="categorySlug" value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)} required>
          {groups.map(([slug, name]) => (
            <optgroup key={slug} label={name}>
              {categories.filter((item) => item.groupSlug === slug).map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
            </optgroup>
          ))}
        </SelectInput>
      </Field>
      <Field label="Title" hint="The public name. It is not a verified claim.">
        <TextInput name="name" required minLength={2} maxLength={80} />
      </Field>
      <Field label="Short description">
        <TextInput name="shortDescription" required minLength={12} maxLength={160} />
      </Field>
      <Field label="Description">
        <TextArea name="fullDescription" required minLength={12} maxLength={5000} />
      </Field>
      <Field label="Public URL" hint="The page people should open. Shorteners and private hosts are blocked.">
        <TextInput name="websiteUrl" type="url" required placeholder="https://" />
      </Field>
      <Field label="Your display name" hint="Shown as the submitter. This does not verify ownership.">
        <TextInput name="creatorName" maxLength={80} />
      </Field>
      <Field label="Image or logo" hint="Optional JPEG, PNG, or WebP under 2 MB.">
        <input className="block text-sm" name="image" type="file" accept="image/jpeg,image/png,image/webp" />
      </Field>
      {fields.map((field) => (
        <Field key={field.key} label={field.label} hint={field.hint}>
          {field.kind === "textarea" ? (
            <TextArea name={`detail_${field.key}`} required={field.required} maxLength={field.max} />
          ) : (
            <TextInput name={`detail_${field.key}`} required={field.required} maxLength={field.max} inputMode={field.kind === "number" ? "numeric" : field.kind === "url" ? "url" : "text"} />
          )}
        </Field>
      ))}
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-medium">Optional social links</legend>
        <TextInput name="social_instagram" placeholder="https://instagram.com/…" aria-label="Instagram URL" />
        <TextInput name="social_youtube" placeholder="https://youtube.com/…" aria-label="YouTube URL" />
        <TextInput name="social_x" placeholder="https://x.com/…" aria-label="X URL" />
        <TextInput name="social_linkedin" placeholder="https://linkedin.com/…" aria-label="LinkedIn URL" />
      </fieldset>
      <fieldset>
        <legend className="text-sm font-medium">Placement</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" name="placement" value="free" checked={placement === "free"} onChange={() => setPlacement("free")} /> Free listing</label>
          <label className="flex items-center gap-2"><input type="radio" name="placement" value="paid" checked={placement === "paid"} onChange={() => setPlacement("paid")} /> Paid rank from ₹99</label>
        </div>
      </fieldset>
      {placement === "paid" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Rank amount in rupees" hint="Whole rupees. Raising a rank must be at least ₹10 above the current amount.">
            <TextInput name="amountRupees" inputMode="numeric" defaultValue="99" required />
          </Field>
          <Field label="Board">
            <SelectInput name="scope" defaultValue="all_time">
              <option value="all_time">All-time</option>
              <option value="daily">Today (IST)</option>
              <option value="category">This category</option>
            </SelectInput>
          </Field>
          <label className="flex items-start gap-2 text-sm sm:col-span-2">
            <input className="mt-1" type="checkbox" name="termsAccepted" />
            <span>I agree to the <Link className="text-brand underline" href="/terms">Terms of Service</Link>. The rank is the confirmed payment, not a review.</span>
          </label>
        </div>
      ) : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Publish listing"}</Button>
    </form>
  );
}

export function ManageForm({
  token,
  listing,
}: {
  token: string;
  listing: {
    name: string;
    websiteUrl: string;
    shortDescription: string;
    fullDescription: string;
    creatorName: string;
    fieldSet: string;
    details: Record<string, string>;
    socialLinks: Record<string, string>;
    status: string;
  };
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [nextPath, setNextPath] = useState("");
  const fields = fieldsFor(listing.fieldSet);

  return (
    <div className="space-y-6">
      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
      {nextPath ? <p className="break-all text-sm">New private link: <Link className="font-semibold text-brand" href={nextPath}>open it</Link>. The previous address no longer works.</p> : null}
      <form className="glass space-y-4 rounded-3xl p-5" action={async (formData) => {
        const result = await updateManagedListingAction(formData);
        if (!result.ok) setError(result.error);
        else {
          setError("");
          setMessage("Saved.");
        }
      }}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="fieldSet" value={listing.fieldSet} />
        <p className="text-sm text-secondary">Status: {listing.status}. Payment confirmation and ownership verification stay separate, and neither is changed from this form.</p>
        <Field label="Title"><TextInput name="name" defaultValue={listing.name} required minLength={2} maxLength={80} /></Field>
        <Field label="Short description"><TextInput name="shortDescription" defaultValue={listing.shortDescription} required minLength={12} maxLength={160} /></Field>
        <Field label="Description"><TextArea name="fullDescription" defaultValue={listing.fullDescription} required minLength={12} /></Field>
        <Field label="Public URL"><TextInput name="websiteUrl" defaultValue={listing.websiteUrl} required /></Field>
        <Field label="Display name"><TextInput name="creatorName" defaultValue={listing.creatorName} maxLength={80} /></Field>
        <Field label="Replace image" hint="Optional JPEG, PNG, or WebP under 2 MB.">
          <input className="block text-sm" name="image" type="file" accept="image/jpeg,image/png,image/webp" />
        </Field>
        {fields.map((field) => (
          <Field key={field.key} label={field.label} hint={field.hint}>
            {field.kind === "textarea" ? (
              <TextArea name={`detail_${field.key}`} defaultValue={listing.details[field.key] ?? ""} required={field.required} maxLength={field.max} />
            ) : (
              <TextInput name={`detail_${field.key}`} defaultValue={listing.details[field.key] ?? ""} required={field.required} maxLength={field.max} />
            )}
          </Field>
        ))}
        <TextInput name="social_instagram" defaultValue={listing.socialLinks.instagram ?? ""} aria-label="Instagram URL" placeholder="https://instagram.com/…" />
        <TextInput name="social_youtube" defaultValue={listing.socialLinks.youtube ?? ""} aria-label="YouTube URL" placeholder="https://youtube.com/…" />
        <TextInput name="social_x" defaultValue={listing.socialLinks.x ?? ""} aria-label="X URL" placeholder="https://x.com/…" />
        <TextInput name="social_linkedin" defaultValue={listing.socialLinks.linkedin ?? ""} aria-label="LinkedIn URL" placeholder="https://linkedin.com/…" />
        <Button type="submit">Save changes</Button>
      </form>
      <div className="flex flex-wrap gap-3">
        <form action={async (formData) => {
          const result = await rotateManageLinkAction(formData);
          if (!result.ok) setError(result.error);
          else setNextPath(result.managePath);
        }}>
          <input type="hidden" name="token" value={token} />
          <Button type="submit" variant="secondary">Replace private link</Button>
        </form>
        <form action={async (formData) => {
          const result = await revokeManageLinkAction(formData);
          if (!result.ok) setError(result.error);
          else setMessage("This private link has been revoked.");
        }}>
          <input type="hidden" name="token" value={token} />
          <Button type="submit" variant="secondary">Revoke private link</Button>
        </form>
        <form action={async (formData) => {
          const result = await removeManagedListingAction(formData);
          if (!result.ok) setError(result.error);
          else setMessage("The listing was removed from the public boards. Past payments stay in the ledger.");
        }}>
          <input type="hidden" name="token" value={token} />
          <Button type="submit" variant="secondary">Remove listing</Button>
        </form>
      </div>
    </div>
  );
}

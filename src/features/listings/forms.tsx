"use client";

import { useState } from "react";
import Link from "next/link";
import { fieldsFor, isActiveFieldSet } from "@/config/catalogue";
import { formatInrFromPaise } from "@/lib/money";
import type { AdPackageDefinition } from "@/config/packages";
import {
  removeManagedListingAction,
  revokeManageLinkAction,
  rotateManageLinkAction,
  submitListingAction,
  updateManagedListingAction,
} from "@/features/listings/actions";
import { Alert, Button, Field, SelectInput, TextArea, TextInput } from "@/components/ui/primitives";
import type { Category } from "@/types/domain";

export function ListingForm({ categories, packages }: { categories: Category[]; packages: AdPackageDefinition[] }) {
  const open = categories.filter((item) => isActiveFieldSet(item.fieldSet));
  const [categorySlug, setCategorySlug] = useState(open[0]?.slug ?? "");
  const [filter, setFilter] = useState("");
  const [placement, setPlacement] = useState<"free" | "paid">("free");
  const [packageSlug, setPackageSlug] = useState<string>(packages[0]?.slug ?? "");
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState<{ managePath: string; checkoutHref?: string; warning?: string } | null>(null);
  const category = open.find((item) => item.slug === categorySlug) ?? open[0];
  const fields = fieldsFor(category?.fieldSet ?? "");
  const visible = open.filter((item) => item.name.toLowerCase().includes(filter.trim().toLowerCase()));
  const selectedPackage = packages.find((item) => item.slug === packageSlug) ?? packages[0];

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
      onChange={() => setPreviewing(false)}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!previewing) {
          setPreviewing(true);
          return;
        }
        setPending(true);
        setError("");
        const result = await submitListingAction(new FormData(event.currentTarget));
        setPending(false);
        if (!result.ok) setError(result.error);
        else setSaved({ managePath: result.managePath, checkoutHref: result.checkoutHref, warning: result.warning });
      }}
    >
      {error ? <Alert>{error}</Alert> : null}
      <Field label="Search categories">
        <TextInput value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search the 10 categories" aria-label="Search categories" />
      </Field>
      <Field label="Category" hint={category?.description}>
        <SelectInput
          name="categorySlug"
          value={category?.slug ?? ""}
          required
          onChange={(event) => {
            const next = event.target.value;
            const form = event.currentTarget.form;
            const dirty = fields.some((field) => {
              const control = form?.elements.namedItem(`detail_${field.key}`);
              return control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement
                ? control.value.trim().length > 0
                : false;
            });
            if (dirty && !window.confirm("Switching category clears fields that only apply to the current category.")) {
              event.target.value = category?.slug ?? "";
              return;
            }
            if (form) {
              for (const field of fields) {
                const control = form.elements.namedItem(`detail_${field.key}`);
                if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) control.value = "";
                if (control instanceof HTMLSelectElement) control.value = "";
              }
            }
            setCategorySlug(next);
            setPreviewing(false);
          }}
        >
          {visible.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
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
        <Field key={`${category?.slug ?? "category"}-${field.key}`} label={`${field.label}${field.required ? " (required)" : " (optional)"}`} hint={field.hint}>
          {field.kind === "select" ? (
            <SelectInput name={`detail_${field.key}`} required={field.required} defaultValue="">
              <option value="">{field.required ? "Choose one" : "Optional"}</option>
              {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
            </SelectInput>
          ) : field.kind === "textarea" ? (
            <TextArea name={`detail_${field.key}`} required={field.required} maxLength={field.max} />
          ) : (
            <TextInput name={`detail_${field.key}`} required={field.required} maxLength={field.max} defaultValue={field.key === "country" ? "India" : undefined} inputMode={field.kind === "url" ? "url" : "text"} />
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
        <legend className="text-sm font-medium">Advertising</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" name="placement" value="free" checked={placement === "free"} onChange={() => setPlacement("free")} /> Organic listing</label>
          <label className="flex items-center gap-2"><input type="radio" name="placement" value="paid" checked={placement === "paid"} onChange={() => setPlacement("paid")} /> Fixed-price advertisement</label>
        </div>
      </fieldset>
      {placement === "paid" && selectedPackage ? (
        <div className="space-y-3">
          <Field label="Package" hint="The price is stored on the server. This form cannot set a different price.">
            <SelectInput name="packageSlug" value={selectedPackage.slug} onChange={(event) => setPackageSlug(event.target.value)}>
              {packages.map((item) => <option key={item.slug} value={item.slug}>{item.name} · {formatInrFromPaise(item.pricePaise)}</option>)}
            </SelectInput>
          </Field>
          <input type="hidden" name="clientPricePaise" value={selectedPackage.pricePaise} />
          <p className="text-sm leading-6 text-secondary">{selectedPackage.description}</p>
          <p className="text-sm leading-6 text-secondary">
            {formatInrFromPaise(selectedPackage.pricePaise)} for {selectedPackage.durationHours} hours from activation.
            If the listing is already approved, the clock starts when payment is verified. If it is still in review, the clock starts when it is approved. A rejection before the advertisement goes live is eligible for a refund review. The confirmed start and end are stored in Asia/Kolkata time when the campaign becomes active.
          </p>
          <Field label="Contact email" hint="Used to reach you about this campaign. It is not shown on the public listing.">
            <TextInput name="contactEmail" type="email" required autoComplete="email" />
          </Field>
        </div>
      ) : null}
      <label className="flex items-start gap-2 text-sm">
        <input className="mt-1" type="checkbox" name="authorized" required />
        <span>I own this destination or I am authorised to promote it. I will not submit an impersonation or a destination I cannot lawfully advertise.</span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input className="mt-1" type="checkbox" name="termsAccepted" required />
        <span>I accept the <Link className="text-brand underline" href="/terms">Terms</Link>, <Link className="text-brand underline" href="/rules">advertising rules</Link>, and <Link className="text-brand underline" href="/privacy">Privacy Policy</Link>.</span>
      </label>
      {previewing ? (
        <div className="rounded-2xl bg-muted px-4 py-3 text-sm leading-6" aria-live="polite">
          <p className="font-semibold text-navy">Preview</p>
          <p>{category?.name}. {placement === "paid" && selectedPackage ? `${selectedPackage.name} at ${formatInrFromPaise(selectedPackage.pricePaise)}. This is an advertisement, not a rating.` : "Organic listing. It is not an advertisement."}</p>
          <p>Submit stores this listing. A paid campaign starts only after the payment is verified on the server.</p>
        </div>
      ) : null}
      <Button type="submit" disabled={pending || open.length === 0}>{pending ? "Saving…" : previewing ? "Submit listing" : "Review listing"}</Button>
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
        {fields.length === 0 ? <Alert>This category is no longer open. Contact support to move the listing.</Alert> : null}
        {fields.map((field) => (
          <Field key={field.key} label={`${field.label}${field.required ? " (required)" : " (optional)"}`} hint={field.hint}>
            {field.kind === "select" ? (
              <SelectInput name={`detail_${field.key}`} required={field.required} defaultValue={listing.details[field.key] ?? ""}>
                <option value="">Choose one</option>
                {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
              </SelectInput>
            ) : field.kind === "textarea" ? (
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
        <label className="flex items-start gap-2 text-sm">
          <input className="mt-1" type="checkbox" name="authorized" required />
          <span>I still own this destination or I am authorised to promote it.</span>
        </label>
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

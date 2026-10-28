"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CHANNEL_LABEL, LANE_SOCIALS, fieldsFor, isActiveFieldSet, type ListingField } from "@/config/catalogue";
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

const socialPlaceholders: Record<string, string> = {
  youtube: "https://youtube.com/…",
  twitch: "https://twitch.tv/…",
  kick: "https://kick.com/…",
  instagram: "https://instagram.com/…",
  x: "https://x.com/…",
  linkedin: "https://linkedin.com/…",
};

export function ListingForm({ categories, packages }: { categories: Category[]; packages: AdPackageDefinition[] }) {
  const open = categories.filter((item) => isActiveFieldSet(item.fieldSet) && fieldsFor(item.slug).length > 0);
  const [categorySlug, setCategorySlug] = useState(open[0]?.slug ?? "");
  const [placement, setPlacement] = useState<"free" | "paid">("free");
  const [packageSlug, setPackageSlug] = useState<string>(packages[0]?.slug ?? "");
  const [previewing, setPreviewing] = useState(false);
  const [draft, setDraft] = useState({ name: "", url: "", summary: "" });
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState<{ managePath: string; checkoutHref?: string; warning?: string } | null>(null);
  const category = open.find((item) => item.slug === categorySlug) ?? open[0];
  const fields = fieldsFor(category?.slug ?? "");
  const selectedPackage = packages.find((item) => item.slug === packageSlug) ?? packages[0];
  const socials = LANE_SOCIALS[category?.slug ?? ""] ?? [];

  if (saved) {
    return (
      <div className="glass space-y-4 rounded-3xl p-5">
        <h2 className="text-xl font-semibold">Profile saved</h2>
        <p className="text-sm leading-6 text-secondary">This private link is the only way to edit the profile. It is not shown on the public page. Store it now. Replacing or revoking it makes this address stop working.</p>
        {saved.warning ? <Alert tone="info">{saved.warning}</Alert> : null}
        <p className="break-all rounded-2xl bg-muted px-3 py-3 text-sm"><Link className="font-semibold text-brand" href={saved.managePath}>Open the private manage link</Link></p>
        {saved.checkoutHref ? <Link className="inline-flex h-11 items-center rounded-full bg-brand px-4 text-sm font-semibold text-on-brand" href={saved.checkoutHref}>Continue to payment</Link> : null}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      className="glass mx-auto max-w-2xl space-y-3 rounded-3xl p-4 sm:p-5"
      onInput={() => {
        if (previewing) setPreviewing(false);
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!previewing) return;
        setPending(true);
        setError("");
        const result = await submitListingAction(new FormData(event.currentTarget));
        setPending(false);
        if (!result.ok) setError(result.error);
        else setSaved({ managePath: result.managePath, checkoutHref: result.checkoutHref, warning: result.warning });
      }}
    >
      {error ? <Alert>{error}</Alert> : null}
      <Field label="Lane" hint={category?.description}>
        <SelectInput name="categorySlug" value={category?.slug ?? ""} required onChange={(event) => setCategorySlug(event.target.value)}>
          {open.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
        </SelectInput>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Creator name">
          <TextInput name="name" required minLength={2} maxLength={80} />
        </Field>
        <Field label="Your name" hint="Submitter. Not an ownership check.">
          <TextInput name="creatorName" maxLength={80} />
        </Field>
        <Field label={CHANNEL_LABEL[category?.slug ?? ""] ?? "Channel URL"} hint="Public page. Shorteners are blocked.">
          <TextInput name="websiteUrl" type="text" inputMode="url" required placeholder="https:// or youtube.com/…" />
        </Field>
        <Field label="Avatar" hint="Optional image, under 2 MB.">
          <input className="block w-full text-sm" name="image" type="file" accept="image/jpeg,image/png,image/webp" />
        </Field>
      </div>
      <Field label="Short description">
        <TextInput name="shortDescription" required minLength={12} maxLength={160} />
      </Field>
      <Field label="About">
        <TextArea name="fullDescription" required minLength={12} maxLength={5000} className="min-h-20" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2" key={category?.slug ?? "lane"}>
        {fields.map((field) => (
          <LaneField key={field.key} field={field} wide={field.kind === "textarea"} />
        ))}
      </div>
      {socials.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <p className="text-sm font-medium sm:col-span-2">Social links</p>
          {socials.map((key) => (
            <TextInput key={key} name={`social_${key}`} placeholder={socialPlaceholders[key]} aria-label={`${key} URL`} />
          ))}
        </div>
      ) : null}
      <fieldset>
        <legend className="text-sm font-medium">Promotion</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" name="placement" value="free" checked={placement === "free"} onChange={() => setPlacement("free")} /> Free profile</label>
          <label className="flex items-center gap-2"><input type="radio" name="placement" value="paid" checked={placement === "paid"} onChange={() => setPlacement("paid")} /> Labelled advertisement</label>
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
          <p className="font-medium">{draft.name || "Untitled profile"}</p>
          <p className="break-all text-secondary">{draft.url}</p>
          <p>{draft.summary}</p>
          <p>{category?.name}. {placement === "paid" && selectedPackage ? `${selectedPackage.name} at ${formatInrFromPaise(selectedPackage.pricePaise)}. This is an advertisement, not a rating.` : "Free profile. It is not an advertisement."}</p>
          <p>Publish stores this profile. A paid campaign starts only after the payment is verified on the server.</p>
        </div>
      ) : null}
      <Button
        type="button"
        disabled={pending || open.length === 0}
        onClick={() => {
          const form = formRef.current;
          if (!form) return;
          if (!previewing) {
            if (!form.reportValidity()) return;
            const data = new FormData(form);
            setDraft({
              name: String(data.get("name") ?? "").trim(),
              url: String(data.get("websiteUrl") ?? "").trim(),
              summary: String(data.get("shortDescription") ?? "").trim(),
            });
            setPreviewing(true);
            return;
          }
          form.requestSubmit();
        }}
      >
        {pending ? "Saving…" : previewing ? "Publish profile" : "Review profile"}
      </Button>
    </form>
  );
}

function LaneField({ field, wide, defaultValue = "" }: { field: ListingField; wide?: boolean; defaultValue?: string }) {
  if (field.kind === "select" && field.options?.length === 1) {
    return <input type="hidden" name={`detail_${field.key}`} value={field.options[0]} />;
  }
  const label = `${field.label}${field.required ? "" : " (optional)"}`;
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <Field label={label} hint={field.hint || undefined}>
        {field.kind === "select" ? (
          <SelectInput name={`detail_${field.key}`} required={field.required} defaultValue={defaultValue}>
            <option value="">{field.required ? "Choose one" : "Optional"}</option>
            {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
          </SelectInput>
        ) : field.kind === "textarea" ? (
          <TextArea name={`detail_${field.key}`} required={field.required} maxLength={field.max} defaultValue={defaultValue} className="min-h-20" />
        ) : (
          <TextInput name={`detail_${field.key}`} required={field.required} maxLength={field.max} defaultValue={defaultValue} inputMode={field.kind === "url" ? "url" : "text"} />
        )}
      </Field>
    </div>
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
    categorySlug: string;
    details: Record<string, string>;
    socialLinks: Record<string, string>;
    status: string;
  };
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [nextPath, setNextPath] = useState("");
  const fields = fieldsFor(listing.categorySlug);
  const socials = [...new Set([...(LANE_SOCIALS[listing.categorySlug] ?? []), ...Object.keys(listing.socialLinks)])].filter((key) => key in socialPlaceholders);

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
        <p className="text-sm text-secondary">Status: {listing.status}. Payment confirmation and ownership verification stay separate, and neither is changed from this form.</p>
        <Field label="Title"><TextInput name="name" defaultValue={listing.name} required minLength={2} maxLength={80} /></Field>
        <Field label="Short description"><TextInput name="shortDescription" defaultValue={listing.shortDescription} required minLength={12} maxLength={160} /></Field>
        <Field label="Description"><TextArea name="fullDescription" defaultValue={listing.fullDescription} required minLength={12} /></Field>
        <Field label="Public URL"><TextInput name="websiteUrl" type="text" inputMode="url" defaultValue={listing.websiteUrl} required placeholder="https:// or youtube.com/…" /></Field>
        <Field label="Display name"><TextInput name="creatorName" defaultValue={listing.creatorName} maxLength={80} /></Field>
        <Field label="Replace image" hint="Optional JPEG, PNG, or WebP under 2 MB.">
          <input className="block text-sm" name="image" type="file" accept="image/jpeg,image/png,image/webp" />
        </Field>
        {fields.length === 0 ? <Alert>This category is no longer open. Contact support to move the listing.</Alert> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <LaneField key={field.key} field={field} wide={field.kind === "textarea"} defaultValue={listing.details[field.key] ?? ""} />
            ))}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {socials.map((key) => (
            <TextInput key={key} name={`social_${key}`} defaultValue={listing.socialLinks[key] ?? ""} aria-label={`${key} URL`} placeholder={socialPlaceholders[key]} />
          ))}
        </div>
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

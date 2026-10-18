import Link from "next/link";
import { site } from "@/config/site";
import { LegalDocument, LegalSection } from "@/content/legal";

export function PrivacyDocument() {
  return (
    <LegalDocument title="Privacy Policy" updated="This describes data the current implementation actually handles. It needs qualified Indian legal review, including under the Digital Personal Data Protection Act, 2023, before you rely on it.">
      <p>
        {site.name} collects the information below to run the directory, moderate listings, and take payment for advertising packages. It does not collect account passwords for Instagram, YouTube, or other networks, and it does not store card numbers.
      </p>
      <LegalSection title="Listing and account data">
        <p>When you submit a listing we store the title, descriptions, public URL, category, category-specific fields you fill in, optional social links, and an optional logo or image. Images go in a public media bucket so the directory can show them. A country or audience value defaults to India if you leave it blank.</p>
        <p>If you buy a package we store a contact email in a private table that is not part of the public listing. The private manage link is stored only as a hash.</p>
        <p>If you create an account we store the email, display name, username, and optional bio or website that Supabase Auth and the profile table hold. Session cookies keep you signed in.</p>
      </LegalSection>
      <LegalSection title="Payments">
        <p>Orders store the package, the amount in paise, currency (INR), status, provider name, provider order id, and provider payment id when a payment is verified. Ledger rows store the charge or refund amount. We do not store card numbers, UPI PINs, or full payment-instrument details. Razorpay processes the payment when live mode is on. Live mode stays off until that provider approves this model. Sandbox orders are local test records.</p>
      </LegalSection>
      <LegalSection title="Logs, analytics, and security">
        <p>View and click counts are aggregated by day. A salted hash is stored so the same visit is not counted twice on the same day. The raw IP address is not written into that analytics row. Submission, checkout, and report routes also rate-limit using a short-lived hash of the caller address in process memory.</p>
        <p>Webhook failures and admin audit rows record operational errors and moderation actions. They are not a public profile.</p>
      </LegalSection>
      <LegalSection title="Why we use it, and who else sees it">
        <p>We use this information to publish the directory, run a campaign you bought, moderate abuse, prevent duplicate payments, and answer a support or refund request. Payment data is shared with the payment provider to the extent needed to take or reverse a charge. Hosting and the database are on the operator&apos;s infrastructure, currently Supabase and the application host. We do not sell a data API or run a third-party ad network.</p>
        <p>The legal basis the operator intends to rely on, subject to counsel, is that you provided the listing and payment for this service. Do not treat that sentence as a completed DPDPA assessment.</p>
      </LegalSection>
      <LegalSection title="Retention and your requests">
        <p>Public listing text stays while the listing is published. Removing a listing from the private manage link, or deleting an account where that flow is available, detaches the public profile. Payment and ledger rows are kept so completed charges can be reconciled. We do not promise a specific deletion time for backups or for payment records a bank or provider requires us to keep.</p>
        <p>Traffic to the site uses HTTPS. We do not claim that every database field has its own application-level encryption beyond what the host provides.</p>
        <p>To ask about your data, use the <Link className="text-brand underline" href="/contact">contact page</Link>. Include enough detail for us to find the listing or order. We do not promise a response time that the law does not already require.</p>
      </LegalSection>
      <LegalSection title="Operator identity">
        <p>Legal name and contact address of the operator: [to be completed by the operator]. Until that is filled in, use the contact page.</p>
      </LegalSection>
    </LegalDocument>
  );
}

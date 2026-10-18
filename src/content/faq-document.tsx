import Link from "next/link";
import { PACKAGE_DEFAULTS } from "@/config/packages";
import { site } from "@/config/site";
import { LegalDocument, LegalSection } from "@/content/legal";
import { formatInrFromPaise } from "@/lib/money";

export function FaqDocument() {
  return (
    <LegalDocument title="FAQ" updated="This page describes the fixed-price directory. It needs qualified Indian legal review before you rely on it.">
      <LegalSection title="What is RankPush?">
        <p>{site.name} is a public directory of websites, digital products, creator profiles, and other permitted destinations. Paid placements are advertisements with a fixed price and a fixed duration. They are not ratings or endorsements.</p>
      </LegalSection>
      <LegalSection title="How do listings work?">
        <p>Choose a category, complete the fields for that category, and submit. You do not need an account. You receive a private link to edit or remove the listing. New listings can be held for review. Organic listings, once approved, appear in newest-approval order.</p>
      </LegalSection>
      <LegalSection title="What does an advertiser purchase?">
        <p>A named package: where the advertisement appears, how long it runs, and the price in INR. The server sets the price. The form cannot choose a different one.</p>
      </LegalSection>
      <LegalSection title="How much does each package cost?">
        <ul className="list-disc space-y-1 pl-5">
          {PACKAGE_DEFAULTS.map((item) => <li key={item.slug}>{item.name}: {formatInrFromPaise(item.pricePaise)}.</li>)}
        </ul>
        <p>These are the current test prices. Checkout shows the price stored on the server at the time the order is created. Live payment stays disabled until the payment provider approves this model.</p>
      </LegalSection>
      <LegalSection title="How long does a campaign run?">
        <p>A daily featured listing runs for 24 hours from activation. A weekly featured listing and a weekly category sponsorship run for seven days from activation. If the listing is still in review, the clock starts when it is approved. The confirmed start and end are stored in Asia/Kolkata time when the campaign becomes active.</p>
      </LegalSection>
      <LegalSection title="Where will an advertisement appear?">
        <p>Daily Featured Listing: Today&apos;s Featured Ads. Weekly Featured Listing: the featured strip on the permanent directory. Weekly Category Sponsor: the sponsored area of that one category. Organic results stay in their own list.</p>
      </LegalSection>
      <LegalSection title="How are placements allocated?">
        <p>You buy the package you selected. Packages are not exclusive unless a future package says so and the server refuses an overlapping sale. Shared places are ordered by activation time. Paying more does not move you ahead of an advertisement that started earlier.</p>
      </LegalSection>
      <LegalSection title="Is RankPush an auction or bidding website?">
        <p>No.</p>
      </LegalSection>
      <LegalSection title="Does a paid placement guarantee traffic, clicks, sales, or conversions?">
        <p>No.</p>
      </LegalSection>
      <LegalSection title="Can a listing be rejected?">
        <p>Yes. Prohibited destinations, impersonation, missing authorisation, and other rule breaches can be rejected or removed.</p>
      </LegalSection>
      <LegalSection title="What happens if payment succeeds but the campaign is not activated?">
        <p>The order is marked for refund review. A browser redirect is not enough to start a campaign. Activation follows a verified payment and, when review applies, approval.</p>
      </LegalSection>
      <LegalSection title="Can an advertiser cancel a campaign?">
        <p>You can ask us to stop a campaign that has not started. A campaign that has already started is not automatically refunded. See <Link className="text-brand underline" href="/refunds">Refunds</Link>.</p>
      </LegalSection>
      <LegalSection title="How are refunds handled?">
        <p>The cases and the request path are on the <Link className="text-brand underline" href="/refunds">Refunds</Link> page. Banking and provider timelines apply. We do not promise a fixed number of days.</p>
      </LegalSection>
      <LegalSection title="Can I submit a listing without an account?">
        <p>Yes. Browsing and submitting do not require an account. The private manage link is how you edit or remove that listing. An account is available if you want a dashboard.</p>
      </LegalSection>
      <LegalSection title="How can I contact support or report abuse?">
        <p>Use the <Link className="text-brand underline" href="/contact">contact page</Link>, or the report form on a listing. Do not send passwords, session cookies, or identity documents.</p>
      </LegalSection>
    </LegalDocument>
  );
}

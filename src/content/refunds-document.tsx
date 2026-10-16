import Link from "next/link";
import { site } from "@/config/site";
import { LegalDocument, LegalSection } from "@/content/legal";

export function RefundsDocument() {
  return (
    <LegalDocument
      title="Refunds"
      updated="Effective 16 October 2026. Last updated 16 October 2026."
    >
      <p>
        This page is the refund policy for paid ranks on {site.domain}. A paid rank is a digital advertising placement. It is not an auction. Read it with the <Link className="text-brand underline" href="/terms">Terms of Service</Link> and the <Link className="text-brand underline" href="/rules">Rules</Link>.
      </p>

      <LegalSection title="A delivered rank is final">
        <p>A payment that is applied to a rank is final and not refundable. The digital service starts when payment is confirmed: the listing is created or the rank amount is raised, and that amount is counted on the public board.</p>
        <p>These are not grounds for a refund:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Someone else later pays more and places above you.</li>
          <li>Today&apos;s board resets at midnight IST.</li>
          <li>The listing receives fewer clicks than you hoped for.</li>
          <li>You dislike the category, the preview rank, or the result.</li>
          <li>The listing is later removed because it broke the Terms or the Rules.</li>
          <li>You change your mind after the rank is live.</li>
        </ul>
        <p>By completing checkout you ask us to start this digital service immediately.</p>
      </LegalSection>

      <LegalSection title="When we refund">
        <p>We refund when the service you paid for is not delivered:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>A confirmed payment cannot be applied because it does not raise the current rank amount. The existing rank stays. The order is marked for refund.</li>
          <li>You were charged twice for the same order.</li>
          <li>The payment succeeded and the listing was not written to the board because of a failure on our side.</li>
        </ul>
        <p>Where the Consumer Protection Act, 2019 gives you a right we cannot take away — including a real failure to provide the paid placement — that right still applies. Being placed lower because someone paid more is not that failure. The Rules explain that a higher amount takes the higher rank.</p>
      </LegalSection>

      <LegalSection title="How a refund is made">
        <p>Live checkout is processed by Razorpay. {site.name} does not store card or UPI credentials. A refund of a live payment is sent back through Razorpay to the original method. Bank and UPI timelines are set by Razorpay and your bank, not by this page.</p>
        <p>A provider refund event removes the placement that the refunded order created. Failed and cancelled payments do not change a rank.</p>
        <p>Sandbox payments are not real charges and cannot be refunded by a bank.</p>
        <p>To ask about an order that was not applied, use the <Link className="text-brand underline" href="/contact">contact page</Link> and include the receipt or order id. We acknowledge a grievance within 48 hours and aim to resolve it within one month, in line with the Consumer Protection (E-Commerce) Rules, 2020.</p>
      </LegalSection>

      <LegalSection title="Disputes and chargebacks">
        <p>A chargeback or payment dispute without a legally required basis is a breach of the Terms. We may remove the listing and refuse future use of the Service. Contact us before opening a dispute if the rank was not applied. That is the case this policy refunds.</p>
      </LegalSection>

      <p>
        Related: <Link className="underline" href="/rules">Rules</Link>, <Link className="underline" href="/terms">Terms</Link>, <Link className="underline" href="/faq">FAQ</Link>.
      </p>
    </LegalDocument>
  );
}

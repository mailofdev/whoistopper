import Link from "next/link";
import { site } from "@/config/site";
import { LegalDocument, LegalSection } from "@/content/legal";

export function RefundsDocument() {
  return (
    <LegalDocument title="Refunds" updated="This policy matches the fixed-price campaign flow. Timelines depend on the payment provider and your bank. It needs qualified Indian legal review before you rely on it.">
      <p>
        This page explains when an advertising payment on {site.domain} can be refunded. A package is a digital advertisement with a disclosed place and duration. It is not an auction.
      </p>
      <LegalSection title="Eligible for a refund review">
        <ul className="list-disc space-y-2 pl-5">
          <li>The listing is rejected before the campaign is activated.</li>
          <li>Payment is verified but the campaign is not activated, including where review takes so long that the listing is refused.</li>
          <li>The same package is charged twice, or the amount taken does not match the server price.</li>
          <li>You cancel before the campaign has started.</li>
          <li>A technical failure on our side stops the advertisement from being shown for a material part of the paid window. We look at the campaign record, not at a traffic estimate.</li>
        </ul>
        <p>Those orders are marked for refund review. A ranking-style payment, which this directory no longer sells, is also marked for refund review and does not change anyone&apos;s place.</p>
      </LegalSection>
      <LegalSection title="A campaign that has started">
        <p>Once a campaign is active, the advertisement has begun. We do not refund it because another advertisement shares the placement, because organic order did not change, or because visits or sales were lower than you hoped. We also do not refund it because you prefer a different category after it has started.</p>
        <p>If we take the advertisement down for a rule breach after it has started, that removal is not by itself a refund.</p>
      </LegalSection>
      <LegalSection title="How to ask">
        <p>Write through the <Link className="text-brand underline" href="/contact">contact page</Link> with the order id or the provider payment id and the listing URL. We match that to the payment record. We do not publish a guaranteed number of days. The payment provider and your bank add their own time after we approve a refund.</p>
        <p>A verified refund event marks the order refunded and stops the campaign that order created. Failed and cancelled checkouts do not start a campaign.</p>
      </LegalSection>
      <p>Where the Consumer Protection Act, 2019 gives you a right that cannot be waived, that right still applies. This page does not try to remove it.</p>
    </LegalDocument>
  );
}

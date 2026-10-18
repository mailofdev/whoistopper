import Link from "next/link";
import { site } from "@/config/site";
import { LegalDocument, LegalSection } from "@/content/legal";

export function TermsDocument() {
  return (
    <LegalDocument title="Terms of Service" updated="Draft for the fixed-price directory. The operator must add the legal name, status, and address. This is not a substitute for qualified Indian legal review.">
      <p>
        These terms cover use of {site.domain}, including the directory, listing submission, and advertising checkout. By submitting a listing or paying for a package, you agree to these terms, the <Link className="text-brand underline" href="/rules">Rules</Link>, and the <Link className="text-brand underline" href="/privacy">Privacy Policy</Link>.
      </p>
      <LegalSection title="Who operates the service">
        <p>Legal entity, registration number, and registered office: [to be completed by the operator]. Until that information is published, do not treat these terms as a finished customer contract.</p>
      </LegalSection>
      <LegalSection title="The service">
        <p>{site.name} publishes a directory and sells fixed-price advertising packages. A package discloses its place, duration, and price before payment. It is an advertisement. It is not a rating, review, endorsement, or promise of traffic, clicks, sales, or conversions.</p>
        <p>There is no auction and no pay-more-to-overtake. Organic listings are ordered independently of advertising spend. You must be able to form a contract and you must be allowed to promote the destination you submit.</p>
      </LegalSection>
      <LegalSection title="Your listing">
        <p>You confirm that you own the destination or you are authorised to advertise it, and that the words and images you submit may lawfully be shown. You will not impersonate another person or brand, submit a destination you cannot promote, or include prohibited content described in the Rules.</p>
        <p>We may refuse, edit, recategorise, or remove a listing. Rejection before a campaign starts is covered by the <Link className="text-brand underline" href="/refunds">Refunds</Link> page.</p>
      </LegalSection>
      <LegalSection title="Packages, payment, and campaigns">
        <p>Prices are in Indian rupees and are set on the server. The amount you are charged is the package price at the time the order is created, shown before you pay. We do not store card numbers. A payment provider processes the charge.</p>
        <p>A campaign starts when payment is verified and, if review is required, when the listing is approved. The duration is the package length from that activation. We do not extend it or charge more because someone else buys a package. A browser return from the payment page does not activate a campaign.</p>
        <p>Live charges remain disabled until the payment provider approves this advertising model. Test checkout, where available, is labelled as a test and does not move money through a bank.</p>
      </LegalSection>
      <LegalSection title="Cancellation, refunds, and chargebacks">
        <p>Refund eligibility is on the <Link className="text-brand underline" href="/refunds">Refunds</Link> page. A campaign that has started is a digital service that has begun. A chargeback raised without a basis in that policy can lead to removal of the listing. Contact us before opening a payment dispute.</p>
      </LegalSection>
      <LegalSection title="Intellectual property">
        <p>You keep ownership of your listing content. You grant us a non-exclusive licence to host and display it for as long as needed to operate the directory, show an advertisement you bought, and keep a moderation record. {site.name} and the site design stay with the operator. Third-party names stay with their owners.</p>
      </LegalSection>
      <LegalSection title="Liability and disputes">
        <p>The directory is provided as available. Listings can be wrong because they are submitted by advertisers. To the extent Indian law allows, we are not liable for lost profits, lost traffic, or decisions a visitor makes after leaving the site. Nothing here removes a right the Consumer Protection Act, 2019, or another mandatory rule, does not allow us to remove.</p>
        <p>Governing law and courts: [to be completed by the operator, for example the courts at the operator&apos;s place of business in India]. Contact: the <Link className="text-brand underline" href="/contact">contact page</Link>.</p>
      </LegalSection>
      <LegalSection title="Changes">
        <p>We can change the directory, the packages, and these terms. The date on this page changes when the text changes. A payment already taken keeps the package that was shown at checkout, except where the law requires otherwise.</p>
      </LegalSection>
    </LegalDocument>
  );
}

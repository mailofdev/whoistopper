import Link from "next/link";
import { site } from "@/config/site";
import { LegalDocument, LegalSection } from "@/content/legal";

export function PrivacyDocument() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updated="Effective 16 October 2026. Last updated 16 October 2026."
    >
      <div className="space-y-3">
        <p>
          This Privacy Policy explains how {site.domain} collects, uses, and shares information when you visit the site, open a listing, submit a listing, create an account, or pay for a ranking. It sits alongside our <Link className="text-brand underline" href="/terms">Terms of Service</Link>.
        </p>
        <p>
          The operator of {site.name} is the Data Fiduciary for personal data processed through the Service under the Digital Personal Data Protection Act, 2023. In this policy, &quot;we&quot;, &quot;us&quot;, and &quot;our&quot; mean that operator.
        </p>
      </div>

      <LegalSection title="Who is responsible">
        <p>The Service is operated from India and provided at https://{site.domain}.</p>
        <p>Privacy requests and grievances: the <Link className="text-brand underline" href="/contact">contact page</Link>. We acknowledge a grievance within 48 hours and aim to resolve it within one month.</p>
      </LegalSection>

      <LegalSection title="What we collect">
        <p>We keep the Service small. We collect what we need to run the board, take payment, stop abuse, and keep accounts that people choose to open.</p>
        <p>Listing data. The URL or X handle you submit, the category, the rank amount, the name and description, images you upload, and optional details such as a profile handle. Payment confirmation identifiers from Razorpay (order and payment ids) are stored so we can place the ranking. A private manage link is stored as a hash, not as the raw secret.</p>
        <p>Payment data. Card, UPI, and billing details are collected by Razorpay, not by us. Razorpay may send us confirmation that you paid, an amount, and a status. See Razorpay&apos;s own privacy notice. Sandbox checkouts are test records and are not bank charges.</p>
        <p>Clicks and views. When a listing is opened or a click is counted, we may record the listing, the day, and a salted hash of the IP address and user agent. The hash is for counting and duplicate reduction. We do not store the raw IP address in that count. Counting pauses in production if the salt is missing.</p>
        <p>Account data. If you create an account, we store the email address, authentication session, and the public profile fields you choose to show (display name, username, and bio). Email addresses are not shown on the public board.</p>
        <p>Technical data. Our host and database may process standard request data such as user agent, referrer, and IP address to operate and secure the Service.</p>
        <p>Messages you send us. If you contact us about a notice, a category correction, a payment, or a privacy request, we keep that correspondence as needed to respond and to keep a legal record.</p>
        <p>Theme preference. Your browser may store a theme choice in local storage so the page can stay light or dark. That value stays on your device.</p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>Signed-in sessions use authentication cookies so the account stays logged in. They are strictly necessary for that account. We do not use them for advertising.</p>
        <p>The public board does not set an advertising cookie and does not run a third-party ad network. A theme preference, if you set one, is stored locally in the browser.</p>
      </LegalSection>

      <LegalSection title="Why we use this data">
        <p>Specified purpose. You give us a listing, a payment, or an account so we can take payment, create or raise a rank, show the board, and provide the Service you asked for. Under the Digital Personal Data Protection Act, 2023, that voluntary provision for this purpose is a permitted ground.</p>
        <p>Security and fairness. We use hashes, rate limits, and request logs to keep the board fair, reduce fake clicks, debug outages, and defend legal claims.</p>
        <p>Legal obligation. We keep tax, accounting, payment, and complaint records where Indian law requires it, including records a payment aggregator or tax authority may require.</p>
        <p>We do not sell your personal data. We do not use it to build an advertising profile.</p>
      </LegalSection>

      <LegalSection title="Public listings">
        <p>Rank, amount, names, images, descriptions, and destination links on the board are public. Anyone can see them, including search engines. Do not list a destination if you do not want that information shown. A public profile shows the display name, username, and bio the account holder published. It does not show the email address.</p>
      </LegalSection>

      <LegalSection title="Who we share data with">
        <p>Razorpay — live checkout and payment confirmation. Razorpay is a payment aggregator regulated in India. Their terms and privacy notice apply to the payment itself.</p>
        <p>Hosting, database, and edge infrastructure (currently including Vercel and Postgres, which may be provided through Supabase) so the site can run.</p>
        <p>Professional advisers, authorities, or a buyer of the Service if we must share data to comply with law, enforce the Terms, or transfer the project.</p>
        <p>Some processors may be outside India. The Digital Personal Data Protection Act, 2023 allows a transfer except to a country the Central Government restricts. We use these processors to run the Service you asked for.</p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>Public ranking entries stay while the listing is on the board and may remain in backups or activity history after a takedown for a limited time.</p>
        <p>Payment identifiers and amounts are kept as long as needed for accounting, tax, fraud, and dispute handling under Indian law.</p>
        <p>Click and view hashes are kept as daily counts for as long as those counts are useful to operate the board.</p>
        <p>Account data stays until you delete the account. You can export your profile, listings, and payment history from account settings. Financial ledger rows may be retained where tax or accounting rules require it.</p>
        <p>Correspondence stays as long as needed to answer you and to keep a record of a complaint or legal notice.</p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>If the Digital Personal Data Protection Act, 2023 applies to you, you may ask us to access, correct, erase, or share a summary of personal data we hold about you, and you may nominate another person to exercise those rights if you die or become unable to do so. You may withdraw consent where processing was based on consent. Withdrawal does not undo a payment already completed or a listing already made public.</p>
        <p>Email us through the <Link className="text-brand underline" href="/contact">contact page</Link>. We may need enough information to find your data. Public listing content that is also on your own website or profile is not made private just by appearing on the board. You can ask us to remove the listing. Removal does not refund a rank that was already delivered.</p>
        <p>You may also complain to the Data Protection Board of India once that route is available for your request, and you may use the grievance contact above first.</p>
      </LegalSection>

      <LegalSection title="Children">
        <p>The Service is for adults. You must be at least 18. We do not knowingly collect personal data from children. If you believe a child has used the Service, contact us and we will delete the data we can identify.</p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>We may update this policy when the Service or the law changes. The date at the top of this page is the current version. If a change is material, we will post the updated policy here.</p>
      </LegalSection>

      <p>
        Questions: <Link className="text-brand underline" href="/contact">contact {site.name}</Link>.
        Related: <Link className="underline" href="/rules">Rules</Link>, <Link className="underline" href="/terms">Terms</Link>, <Link className="underline" href="/refunds">Refunds</Link>.
      </p>
    </LegalDocument>
  );
}

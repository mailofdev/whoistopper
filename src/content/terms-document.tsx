import Link from "next/link";
import { site } from "@/config/site";
import { LegalDocument, LegalSection } from "@/content/legal";

export function TermsDocument() {
  return (
    <LegalDocument
      title="Terms of Service"
      updated="Effective 16 October 2026. Last updated 16 October 2026."
    >
      <div className="space-y-3">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern access to and use of {site.domain} (the &quot;Service&quot;), including the public leaderboard, listing pages, checkout, and related features. By using the Service, creating a listing, or completing a payment, you agree to these Terms and to our <Link className="text-brand underline" href="/privacy">Privacy Policy</Link>.
        </p>
        <p>If you do not agree, do not use the Service and do not pay for a ranking. Before checkout you must confirm, by checking a box, that you have read and agree to these Terms.</p>
      </div>

      <LegalSection title="Operator and contact">
        <p>
          The Service is operated from India by the operator of {site.name} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) and is provided from https://{site.domain}. Legal notices, listing complaints, privacy requests, and grievances go through the <Link className="text-brand underline" href="/contact">contact page</Link>.
        </p>
        <p>
          We acknowledge a grievance within 48 hours and aim to resolve it within one month, as the Consumer Protection (E-Commerce) Rules, 2020 require for an e-commerce entity. The same contact is the grievance channel under the Digital Personal Data Protection Act, 2023 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
        </p>
        <p>These Terms work together with the public <Link className="underline" href="/rules">Rules</Link> and the <Link className="underline" href="/refunds">Refunds</Link> page. If the Rules and these Terms conflict on a contract question, these Terms control. The Rules still decide how a board is ordered.</p>
      </LegalSection>

      <LegalSection title="What the Service is">
        <p>
          {site.domain} is a paid public ranking. You may pay, in Indian rupees, to list a public website, profile, or other allowed destination and to occupy a rank based on the amount paid, according to the Rules. Listings that are paid are labelled advertisements. They are not editorial reviews, certifications, endorsements, or independent rankings.
        </p>
        <p>
          The Service is not an auction and not a bidding platform. You buy a ranking placement. The amount you choose is the price of that placement. The board orders paid placements by the amount paid.
        </p>
        <p>
          A payment buys a chance to appear on the board you selected, at the rank that amount can take when it is fulfilled. It does not buy traffic, clicks, customers, revenue, exclusive placement, a fixed time at a specific rank, search-engine ranking, or any particular result. Someone else can pay more and place above you. Today&apos;s board only counts amounts confirmed since midnight IST (Asia/Kolkata) on the current calendar day. We may change, pause, or discontinue features, including categories and ranking formulas.
        </p>
      </LegalSection>

      <LegalSection title="Eligibility">
        <p>You must be at least 18 years old and able to form a binding contract.</p>
        <p>If you use the Service for a company, you represent that you have authority to bind that company, and &quot;you&quot; includes that company.</p>
        <p>You may not use the Service if you are prohibited from receiving services under the laws of India or another applicable jurisdiction, including trade sanctions.</p>
      </LegalSection>

      <LegalSection title="Payments, Razorpay, and taxes">
        <p>
          Live checkout is processed by Razorpay, a payment aggregator. Sandbox mode, when it is on, is an in-app test and is not a bank charge. We do not collect or store full payment-card numbers, UPI credentials, or similar payment secrets. Razorpay&apos;s terms and privacy notice also apply to a live payment.
        </p>
        <p>
          Amounts are priced in Indian rupees. If goods and services tax applies to the operator, it is shown before you pay. Rank amounts, the ₹99 minimum, the ₹10,00,000 maximum, the ₹1 step, and the ₹10 minimum raise are described in the Rules and shown before you pay.
        </p>
        <p>
          Completing checkout is an offer to buy ranking placement on those terms. Rank is assigned when payment is confirmed and the listing is written to the board, at whatever position that amount then supports. The rank shown before you pay is not reserved. Checkout charges the amount you enter. If you already have a rank on that board, the new amount replaces the previous rank amount. It must be at least ₹10 higher.
        </p>
      </LegalSection>

      <LegalSection title="Refunds">
        <p>
          A payment that is applied to a rank is final and not refundable. Ranking placement is a digital service that begins as soon as payment is confirmed: the listing is created or the rank is raised, and the paid amount is counted on the public board. Being placed lower later, a reset of Today&apos;s board at midnight IST, fewer clicks than you hoped for, a category you dislike, downtime, or a later removal for breach of these Terms does not create a refund.
        </p>
        <p>
          If a confirmed payment cannot be applied because it does not raise the current rank, the order is refunded as described on the <Link className="text-brand underline" href="/refunds">Refunds</Link> page. Contact us with the receipt or order id.
        </p>
        <p>
          By completing checkout you request that we start this digital service immediately. Rights that the Consumer Protection Act, 2019 does not allow a business to take away still apply, including where the paid placement is not provided. A chargeback or reversed payment without a legally required basis is a breach of these Terms. We may remove the listing and refuse future use of the Service.
        </p>
      </LegalSection>

      <LegalSection title="Listings must be yours">
        <p>
          You may only list a website, profile, or other destination that you own or are authorised to represent. For a commercial website, the live site should display who is legally responsible for that project: a legal name and a working contact method, and any GST or other identity the law that applies to that site requires. For an X listing, you must be authorised to represent that account. An @handle is stored as the matching x.com profile.
        </p>
        <p>Details that are missing, fake, incomplete, impersonating someone else, or that we cannot reasonably check are grounds for removal. We may take down a listing at any time if those details are not in order. Removal of a delivered rank is not a refund.</p>
      </LegalSection>

      <LegalSection title="Your warranties">
        <p>By submitting a URL, @handle, or payment, you represent and warrant that:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>You have the right to list that destination and to send visitors there.</li>
          <li>The listing and destination comply with applicable law, including the advertising rules of the Advertising Standards Council of India, consumer law, privacy law, intellectual-property law, and any licence the destination needs.</li>
          <li>You are not impersonating another person, brand, or company, and you are not claiming a rank for a competitor&apos;s site or profile without authorisation.</li>
          <li>The destination is not malware, phishing, a scam, or a site whose primary purpose is to deceive visitors.</li>
          <li>The information you submit is accurate, and you will keep it accurate. Submitted details are claims by you. We do not present them as facts we have checked.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Prohibited listings and use">
        <p>In addition to the Rules, you may not list or use the Service for:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Sexual, pornographic, or adult-platform content.</li>
          <li>Chat, invite, or messaging-group links, including Telegram, WhatsApp, Discord, Messenger, Signal, and similar.</li>
          <li>Link shorteners used to hide the real destination.</li>
          <li>Content that is illegal under Indian law, including content that is fraudulent, defamatory, harassing, hateful, violent, or that exploits children.</li>
          <li>Counterfeit goods, unauthorised streaming, or other infringement of copyright, trademark, or other rights.</li>
          <li>Offers that require licences you do not have, including certain financial, medical, gambling, or weapons-related offers.</li>
          <li>Anything that would present this Service as an auction or as a sale of goods.</li>
        </ul>
        <p>You may not interfere with the Service: scraping beyond ordinary browsing, manipulating click counts, bypassing rate limits, automated rank claims without our written permission, or reverse engineering except as allowed by mandatory law.</p>
      </LegalSection>

      <LegalSection title="Our right to remove listings">
        <p>We may refuse, delay, edit, recategorise, hide, or permanently remove any listing, rank, or related page, with or without notice, including where we believe these Terms, the Rules, or the law may have been broken; where a rights holder or a platform complains; where the destination is not one you are allowed to represent; or where we think the listing creates legal, security, or reputational risk. Removal does not entitle you to a refund of a rank that was delivered. We may also act on a notice under the Information Technology Act, 2000 and the Intermediary Guidelines.</p>
      </LegalSection>

      <LegalSection title="Names, marks, and destinations">
        <p>
          To run the board we display the name, description, and destination you submit, a mark derived from that name, and a logo when one is saved on the listing. We use that material only to identify the listed product or profile on {site.domain}, to show visitors where a paid ranking leads, and to operate and moderate the Service. Click counts, when shown, are what our systems recorded. They are not a promise of future traffic.
        </p>
        <p>Where a trademark or other sign appears, we use it to identify the destination. That display is not a claim that the rights holder sponsors or endorses the Service, unless the lister is that rights holder.</p>
        <p>{site.name}, the wordmark, and the look of the Service are ours. You may not copy the Service, scrape the board for a competing ranking product, or use our brand in a way that suggests we endorse you. X, Razorpay, and other third-party names remain their owners&apos; property.</p>
      </LegalSection>

      <LegalSection title="Licence you grant us">
        <p>You grant us a worldwide, non-exclusive, royalty-free licence to host, cache, reproduce, adapt for sizing and ranking display, and publicly display the listing you submit, for as long as needed to operate, promote, and keep an archive of the Service. You also grant visitors a right to see that listing on the Service. If you want a listing taken down, use the contact page. Takedown does not undo a completed payment.</p>
      </LegalSection>

      <LegalSection title="Complaints and rights notices">
        <p>If you believe a listing infringes your copyright, trademark, publicity, or other rights, or that a listed site is unlawful, contact us with: (1) your name and contact details; (2) the listing URL on this Service; (3) the destination URL or @handle; (4) a description of the problem; and (5) a statement that the notice is accurate and that you are the rights holder or authorised to act. We may remove or restrict the listing while we review the notice. We may share the notice with the lister. Repeat or abusive notices may be ignored.</p>
      </LegalSection>

      <LegalSection title="No endorsement">
        <p>Appearance on the board is not our opinion of a product. We do not verify that listed companies, claims, prices, or results are true. Click counts describe what our systems recorded. They are not a promise that you will get the same outcome. Your results depend on your rank, your destination, timing, and factors we do not control.</p>
        <p>Links from the Service to listed sites or profiles leave this Service. Those destinations have their own terms and practices. We are not responsible for them.</p>
      </LegalSection>

      <LegalSection title="Availability and changes">
        <p>We provide the Service as-is. It may be unavailable, slow, or incorrect. We may change ranking rules, minimums, categories, or these Terms. If a change is material, we will update the date at the top of this page. Continued use after a change means you accept the new Terms. For a payment already completed, the Terms in effect at checkout still apply to that payment, except where a change is required by law or needed to address a security or legal risk.</p>
      </LegalSection>

      <LegalSection title="Disclaimers">
        <p>To the fullest extent permitted by Indian law, we disclaim warranties that the law allows us to disclaim, including any warranty that the Service will be uninterrupted, secure, or free of errors, or that listings, names, images, ranks, or click counts are accurate or complete. Nothing in these Terms excludes liability that the Consumer Protection Act, 2019 or another mandatory rule does not allow us to exclude.</p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>We do not limit liability that applicable law says we cannot limit, including liability for fraud, or for death or personal injury caused by negligence, or a consumer&apos;s right to bring a complaint for deficiency of service.</p>
        <p>Subject to that, we are not liable for lost profits, lost data, lost goodwill, substitute services, or other indirect or consequential damage that Indian law treats as remote. Our total liability for a claim relating to a payment is limited to the amount you paid us for the listing that the claim concerns.</p>
      </LegalSection>

      <LegalSection title="Indemnity">
        <p>
          You will defend and indemnify the operator of {site.name} and people working on the Service against claims, damages, losses, and reasonable legal fees arising out of your listing, your destination, your payment or chargeback, your breach of these Terms, or your infringement of someone else&apos;s rights, except to the extent a mandatory consumer right under Indian law does not allow that indemnity. We may take over the defence of a claim. You will cooperate.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These Terms are governed by the laws of India. Ranks are priced and paid in Indian rupees. If you are a consumer, you may approach the consumer commission that has jurisdiction under the Consumer Protection Act, 2019, including where you reside or where the cause of action arose, in addition to any other forum the law gives you. If you are not a consumer, the courts in India have jurisdiction to the extent the law allows.
        </p>
      </LegalSection>

      <LegalSection title="General">
        <p>If a part of these Terms is unenforceable, the rest remains in effect, and the invalid part is replaced by the valid term that comes closest to the original intent. Our failure to enforce a provision is not a waiver. You may not assign these Terms without our consent. We may assign them in connection with a transfer of the Service.</p>
        <p>These Terms, the Rules, the Privacy Policy, the Refunds page, and the checkout details you confirm form the entire agreement for the Service. Payments and hosting involve third parties, including Razorpay for live checkout. Their outages or decisions are outside our control.</p>
      </LegalSection>

      <p>
        Questions: <Link className="text-brand underline" href="/contact">contact {site.name}</Link>.
        Related: <Link className="underline" href="/rules">Rules</Link>, <Link className="underline" href="/privacy">Privacy</Link>, <Link className="underline" href="/refunds">Refunds</Link>, <Link className="underline" href="/faq">FAQ</Link>.
      </p>
    </LegalDocument>
  );
}

import Link from "next/link";
import { site } from "@/config/site";

const sections: Array<{ title: string; paragraphs: string[] }> = [
  {
    title: "Agreement",
    paragraphs: [
      `These Terms of Service ("Terms") govern access to and use of ${site.domain} (the "Service"), including the public leaderboard, product pages, checkout, and related features. By using the Service, creating a listing, or completing a payment, you agree to these Terms and to the Privacy Policy.`,
      "If you do not agree, do not use the Service and do not pay for a ranking. Before checkout you must confirm, by checking a box, that you have read and agree to these Terms.",
    ],
  },
  {
    title: "Operator and contact",
    paragraphs: [
      `The Service is operated by the operator of ${site.name} ("we", "us", "our") and is provided from https://${site.domain}. Legal notices, listing complaints, and support go through the contact page. These Terms work together with the public Rules and the Refunds page. If the Rules and these Terms conflict on a contract question, these Terms control. The Rules still decide how a board is ordered.`,
    ],
  },
  {
    title: "What the Service is",
    paragraphs: [
      `${site.domain} is a paid public ranking. You may pay to list a product website or an X profile and to occupy a rank based on the amount paid, according to the Rules. Listings are paid advertisements, not editorial reviews, certifications, endorsements, or independent rankings.`,
      "A payment buys a chance to appear on the board at the rank that amount can take at the time it is fulfilled. It does not buy traffic, clicks, customers, revenue, exclusive placement, a fixed duration at a specific rank, search-engine ranking, or any particular result. Someone else can pay more and outrank you. Today's board only counts spend since midnight IST (Asia/Kolkata) on the current calendar day. We may change, pause, or discontinue features, including categories and ranking formulas.",
    ],
  },
  {
    title: "Eligibility",
    paragraphs: [
      "You must be at least 18 years old and able to form a binding contract. If you use the Service for a company, you represent that you have authority to bind that company, and \"you\" includes that company. You may not use the Service if you are prohibited from receiving services under the laws of India or another applicable jurisdiction, including trade sanctions.",
    ],
  },
  {
    title: "Payments, Razorpay, and taxes",
    paragraphs: [
      "Checkout is processed by Razorpay when live payments are enabled, or by the in-app sandbox when the project is in sandbox mode. We do not collect or store full payment-card numbers. Razorpay's terms and privacy notice also apply to a live payment. Amounts are priced in Indian rupees. Applicable taxes may be added at checkout.",
      "Rank amounts, the minimum bid, the minimum increase, and raise-only-the-difference charges are described in the Rules and shown before you pay. Completing checkout is an offer to buy ranking placement on those terms. Rank is assigned when payment is confirmed and the listing is written to the board, at whatever position that amount then supports. The rank shown before you pay is not reserved.",
    ],
  },
  {
    title: "No refunds",
    paragraphs: [
      "A payment that is applied to a rank is final and not refundable. Ranking placement is a digital service that begins as soon as payment is confirmed: the listing is created or the rank is raised, and the paid amount is counted on the public board. Being outranked later, a drop on Today's board at midnight IST, fewer clicks than you hoped for, a category you dislike, downtime, or a later removal for breach of these Terms does not create a refund.",
      "If a verified payment cannot be applied because it does not improve the active bid, the order is marked for refund review. That case is described on the Refunds page. Contact us with the receipt id.",
      "By completing checkout you request that we start this digital service immediately and acknowledge that you lose any statutory right of withdrawal or cooling-off period to the extent that law allows that waiver. Where a mandatory consumer right cannot be waived, we honor that right. Chargebacks, payment disputes, or reversed payments without a legally required basis are a breach of these Terms; we may remove the listing and refuse future use of the Service.",
    ],
  },
  {
    title: "Listings must be yours",
    paragraphs: [
      "You may only list a website or X profile that you own or are authorized to represent. For a website listing, you are responsible for the destination showing who operates that project. For an X listing, you must be authorized to represent that account. An @handle is stored as the matching x.com profile.",
      "Details that are missing, fake, incomplete, impersonating someone else, or that we cannot reasonably verify are grounds for removal. We may take down a listing at any time if those details are not in order, without refund.",
    ],
  },
  {
    title: "Your warranties",
    paragraphs: [
      "By submitting a URL, @handle, or payment, you represent and warrant that: you have the right to list that destination and to send visitors there; the listing and destination comply with applicable law, including advertising, consumer, privacy, intellectual-property, and regulated-industry rules; you are not impersonating another person, brand, or company, and you are not claiming a rank for a competitor's site or profile without authorization; the destination is not malware, phishing, a scam, or a site whose primary purpose is to deceive visitors; and the information you submit is accurate, and you will keep it accurate.",
    ],
  },
  {
    title: "Prohibited listings and use",
    paragraphs: [
      "In addition to the Rules, you may not list or use the Service for: sexual, pornographic, or adult-platform content; chat, invite, or messaging-group links, including Telegram, WhatsApp, Discord, and similar; or link shorteners used to hide the real destination. You may not list content that is illegal, fraudulent, defamatory, harassing, hateful, violent, or that exploits children. You may not list counterfeit goods, unauthorized streaming, or other infringement of copyright, trademark, or other rights. You may not list offers that require licenses you do not have, including certain financial, medical, gambling, or weapons-related offers.",
      "You may not interfere with the Service: scraping beyond ordinary browsing, manipulating click counts, bypassing rate limits, automated rank claims without our written permission, or reverse engineering except as allowed by mandatory law.",
    ],
  },
  {
    title: "Our right to remove listings",
    paragraphs: [
      "We may refuse, delay, edit, recategorize, hide, or permanently remove any listing, rank, or related page, with or without notice, including where we believe these Terms, the Rules, or the law may have been broken; where a rights holder or a platform complains; where the destination is not one you are allowed to represent; or where we think the listing creates legal, security, or reputational risk. Removal does not entitle you to a refund.",
    ],
  },
  {
    title: "Names, marks, and destinations",
    paragraphs: [
      `To run the board we display the name, description, and destination you submit, a mark derived from that name, and a logo when one is already saved on the listing. We use that material only to identify the listed product or profile on ${site.domain}, to show visitors where a paid ranking leads, and to operate and moderate the Service. Click counts, when shown, are what our systems recorded. They are not a promise of future traffic.`,
      "Where a trademark or other sign appears, we use it to identify the destination. That display is not a claim that the rights holder sponsors or endorses the Service, unless the lister is that rights holder.",
      `${site.name}, the wordmark, and the look of the Service are ours. You may not copy the Service, scrape the board for a competing ranking product, or use our brand in a way that suggests we endorse you. X, Razorpay, and other third-party names remain their owners' property.`,
    ],
  },
  {
    title: "License you grant us",
    paragraphs: [
      "You grant us a worldwide, non-exclusive, royalty-free license to host, cache, reproduce, adapt for sizing and ranking display, and publicly display the listing you submit, for as long as needed to operate, promote, and keep an archive of the Service. You also grant visitors a right to see that listing on the Service. If you want a listing taken down, use the contact page. Takedown does not undo a completed payment.",
    ],
  },
  {
    title: "Complaints and rights notices",
    paragraphs: [
      "If you believe a listing infringes your copyright, trademark, publicity, or other rights, or that a listed site is unlawful, contact us with: (1) your name and contact details; (2) the listing URL or product page on this Service; (3) the destination URL or @handle; (4) a description of the problem; and (5) a statement that the notice is accurate and that you are the rights holder or authorized to act. We may remove or restrict the listing while we review the notice. We may share the notice with the lister. Repeat or abusive notices may be ignored.",
    ],
  },
  {
    title: "No endorsement",
    paragraphs: [
      "Appearance on the board is not our opinion of a product. We do not verify that listed companies, claims, prices, or results are true. Click counts describe what our systems recorded. They are not a promise that you will get the same outcome. Your results depend on your rank, your destination, timing, and factors we do not control.",
      "Links from the Service to listed sites or X profiles leave this Service. Those destinations have their own terms and practices. We are not responsible for them.",
    ],
  },
  {
    title: "Availability and changes",
    paragraphs: [
      "We provide the Service as-is. It may be unavailable, slow, or incorrect. We may change ranking rules, minimums, categories, or these Terms. If a change is material, we will update the date at the top of this page. Continued use after a change means you accept the new Terms. For a payment already completed, the Terms in effect at checkout still apply to that payment, except where a change is required by law or needed to address a security or legal risk.",
    ],
  },
  {
    title: "Messages",
    paragraphs: [
      "The Service does not offer a daily or weekly listing newsletter. Messages about a payment or a listing you submitted are limited to operating the Service and answering a request you send us.",
    ],
  },
  {
    title: "Disclaimers",
    paragraphs: [
      "To the fullest extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, secure, or free of errors, or that listings, names, images, ranks, or click counts are accurate or complete.",
    ],
  },
  {
    title: "Limitation of liability",
    paragraphs: [
      "We do not limit liability that applicable law says we cannot limit, including liability for intent, gross negligence, injury to life, body, or health, or liability under mandatory product-liability rules. Subject to that: we are not liable for lost profits, lost data, lost goodwill, substitute services, or other indirect, incidental, special, or consequential damages. For slight negligence, we are liable only for a foreseeable breach of duties that are essential to these Terms, and only for typical, foreseeable damage. Our total liability for a claim relating to a payment is limited to the amount you paid us for the listing that the claim concerns in the three months before the claim.",
    ],
  },
  {
    title: "Indemnity",
    paragraphs: [
      `You will defend, indemnify, and hold harmless the operator of ${site.name} and people working on the Service from claims, damages, losses, and reasonable legal fees arising out of your listing, your destination site or profile, your payment or chargeback, your breach of these Terms, or your infringement of someone else's rights. We may take over the defense of a claim; you will cooperate.`,
    ],
  },
  {
    title: "Governing law",
    paragraphs: [
      "These Terms are governed by the laws of India, excluding conflict-of-law rules, because ranks are priced and paid in Indian rupees. If you are a consumer with a mandatory local law that cannot be displaced, that law still protects you. If you are not a consumer, the courts in India have jurisdiction to the extent the law allows.",
    ],
  },
  {
    title: "General",
    paragraphs: [
      "If a part of these Terms is unenforceable, the rest remains in effect, and the invalid part is replaced by the valid term that comes closest to the original intent. Our failure to enforce a provision is not a waiver. You may not assign these Terms without our consent; we may assign them in connection with a transfer of the Service.",
      "These Terms, the Rules, the Privacy Policy, the Refunds page, and the checkout details you confirm form the entire agreement for the Service. Payments and hosting involve third parties, including Razorpay for live checkout. Their outages or decisions are outside our control.",
    ],
  },
];

export function TermsDocument() {
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-3 text-sm text-secondary">Effective 15 October 2026. Last updated 15 October 2026.</p>
      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-7 text-secondary">{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm leading-7 text-secondary">
        Questions: <Link className="text-brand underline" href="/contact">contact {site.name}</Link>.
        Related: <Link className="underline" href="/rules">Rules</Link>, <Link className="underline" href="/privacy">Privacy</Link>, <Link className="underline" href="/refunds">Refunds</Link>.
      </p>
    </article>
  );
}

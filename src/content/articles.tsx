import { PageHeader } from "@/components/ui/primitives";

export const articles = {
  about: {
    title: "About",
    description: "RankPush is a public directory for digital presence, lifestyle, achievements, and creative work, with transparent paid ranking.",
    body: [
      "RankPush helps people discover products, websites, and tools made for Indian users. Listings can be free. A paid position is a separate, labelled bid in INR.",
      "The rank is calculated from the verified amount. It is not a review, a rating, or a community vote.",
    ],
  },
  faq: {
    title: "FAQ",
    description: "Common questions about listings, ranks, and payments.",
    body: [
      "Can I list without paying? Yes. Approved free listings appear after paid rows.",
      "Does payment guarantee a rank before the money is confirmed? No. The receipt shows the rank only after the provider payment is verified.",
      "When does the daily board reset? At 00:00 IST (Asia/Kolkata). A payment confirmed at 23:59:59.999 IST stays on that date. The next day starts empty.",
      "What wins a tie? The earlier confirmation. If that also matches, the smaller listing id wins.",
    ],
  },
  rules: {
    title: "Ranking rules",
    description: "The rules that decide paid positions.",
    body: [
      "Scopes are all-time, the current IST day, and each category. A listing can have one active paid placement in each scope.",
      "Positions sort by amount in paise, descending. Ties break by earlier confirmation time, then by listing id ascending.",
      "The minimum new bid and the minimum increase are platform settings. The default minimum is ₹99 and the default increase is ₹10.",
      "A later smaller payment never lowers an existing bid. If a verified payment cannot improve the placement, it is marked for refund review.",
      "Daily rows are kept as history. They are excluded from the new IST day because that day uses a new key. A refund or a lost dispute removes the placement that payment created. Failed and cancelled payments do not change a rank.",
      "Free listings are ordered after every paid row and are labelled Free listing.",
    ],
  },
  terms: {
    title: "Terms of Service",
    description: "Terms for browsing RankPush, claiming a paid rank, and completing checkout.",
    body: [
      "The full terms are published on the Terms page. Checkout requires a confirmation that you have read and agree to them.",
      "A paid rank is an advertisement. It is not a review, an endorsement, or a promise of traffic.",
      "You must be at least 18, and you may only list a destination you are allowed to represent.",
    ],
  },
  privacy: {
    title: "Privacy",
    description: "How RankPush handles personal data.",
    body: [
      "Public profiles show a display name, username, bio, and approved listings. Email addresses and payment provider identifiers are not public.",
      "View and click counts store a salted hash, not the raw IP address. Analytics recording pauses in production if the salt is missing.",
      "You can export your profile, listings, and payment history from account settings, and you can delete the account. Financial ledger rows may be retained where tax or accounting rules require it.",
      "This product is aimed at adults operating or discovering businesses. It is not a service for children.",
    ],
  },
  refunds: {
    title: "Refunds",
    description: "When a ranking payment can be refunded.",
    body: [
      "A payment that is applied to a rank is final. Being outranked, a midnight reset of Today's board, or fewer clicks than you hoped for is not a refund.",
      "If a verified payment cannot be applied because it does not improve the active bid, the order is marked needs refund. Contact support with the receipt id. Where a mandatory consumer right cannot be waived, that right still applies.",
      "Live checkout is processed by Razorpay. RankPush does not store card numbers. A provider refund event removes the placement that the refunded order created.",
      "Sandbox payments are not real charges and cannot be refunded by a bank.",
    ],
  },
} as const;

export function Article({ slug }: { slug: keyof typeof articles }) {
  const article = articles[slug];
  return (
    <>
      <PageHeader title={article.title} description={article.description} />
      <div className="glass max-w-3xl space-y-4 rounded-3xl p-5 text-sm leading-7 text-secondary">
        {article.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </>
  );
}

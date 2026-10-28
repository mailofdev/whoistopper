import Link from "next/link";
import { PACKAGE_DEFAULTS } from "@/config/packages";
import { ORGANIC_RANKING_SUMMARY } from "@/features/leaderboards/engine";
import { site } from "@/config/site";
import { LegalDocument, LegalSection } from "@/content/legal";
import { formatInrFromPaise } from "@/lib/money";

export function RulesDocument() {
  return (
    <LegalDocument title="Rules" updated="Updated for the fixed-price directory. This page needs qualified Indian legal review before you rely on it.">
      <p>
        {site.name} publishes public profiles for YouTubers, streamers, and gamers, and sells labelled advertising beside that directory. It is not a rating, a review, an endorsement, or a competition for number one.
      </p>
      <LegalSection title="No bidding">
        <p>There is no auction and no pay-more-to-overtake. You buy a named package. The package states the place, the duration, and the price before payment. The price is stored on the server. Typing a different amount does not change it.</p>
        <p>Identical packages follow the same rule. When several advertisements share a place, they are ordered by activation time: the earlier campaign stays ahead. A later, larger payment does not move it.</p>
        <p>Current test prices, which an administrator can change and which checkout always re-reads from the server:</p>
        <ul className="list-disc space-y-1 pl-5">
          {PACKAGE_DEFAULTS.map((item) => (
            <li key={item.slug}>{item.name}: {formatInrFromPaise(item.pricePaise)} for {item.durationHours} hours. {item.description}</li>
          ))}
        </ul>
        <p>These are test prices. Live charges stay off until the payment provider approves this model. Prices are in Indian rupees. Campaign times are calculated and shown in Asia/Kolkata.</p>
      </LegalSection>
      <LegalSection title="Organic listings and advertisements">
        <p>An approved profile can remain in the creator directory under the content rules. {ORGANIC_RANKING_SUMMARY}</p>
        <p>A paid placement is labelled as an advertisement. It is not labelled verified unless a separate ownership check has been completed, and that check is not a statement that the product is better.</p>
        <p>A daily campaign lasts 24 hours from activation. A weekly campaign lasts seven days from activation. They do not reset at midnight in order to sell the next day&apos;s first place. When a campaign ends, the advertisement stops and the listing returns to the organic directory if it is still approved.</p>
      </LegalSection>
      <LegalSection title="What you can list">
        <p>You may submit a public channel, stream, or player profile you own or are authorised to promote, in one of the open creator lanes. You confirm that before the profile is saved.</p>
        <p>Impersonation, deceptive profiles, copyright infringement, pirated content, malware, sexual content, gambling, illegal wagering, cheating services, and sale of stolen accounts are not allowed. Chat and invite links for Telegram, WhatsApp, Discord, and similar apps are not listing destinations. Link shorteners are rejected.</p>
        <p>We do not ask for account passwords, session cookies, private analytics, government IDs, home addresses, or financials such as turnover, funding, or valuation. Do not send them.</p>
      </LegalSection>
      <LegalSection title="Review and removal">
        <p>Listings can be held, rejected, or removed. A rejection before a campaign is activated is handled on the <Link className="text-brand underline" href="/refunds">Refunds</Link> page. Removal of a campaign that has already started does not, by itself, promise a refund.</p>
        <p>Report a problem from the listing page or the <Link className="text-brand underline" href="/contact">contact page</Link>. We may move a listing that is in the wrong category.</p>
      </LegalSection>
      <p className="text-sm leading-7">
        <Link className="underline" href="/faq">FAQ</Link>
        {" · "}
        <Link className="underline" href="/terms">Terms</Link>
        {" · "}
        <Link className="underline" href="/privacy">Privacy</Link>
        {" · "}
        <Link className="underline" href="/refunds">Refunds</Link>
      </p>
    </LegalDocument>
  );
}

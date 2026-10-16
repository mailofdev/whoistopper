import Link from "next/link";
import { site } from "@/config/site";
import { LegalDocument, LegalSection } from "@/content/legal";

export function RulesDocument() {
  return (
    <LegalDocument title="Rules">
      <div className="space-y-3">
        <p>
          {site.name} is a public leaderboard. There are no third-party ads, no API for sale, and no revenue share. You pay to stand above everyone else. Rank is what you pay — nothing else.
        </p>
        <p>
          A paid rank is a labelled advertisement. This is not an auction, and it is not a bidding platform. You choose a rank amount in Indian rupees. The board orders listings by that amount.
        </p>
      </div>

      <LegalSection title="The boards">
        <p>You choose the board at checkout. A payment counts on that board. It does not automatically buy a rank on every other board.</p>
        <p>All-time is the main board. Rank is the amount confirmed for that listing on All-time. It does not expire.</p>
        <p>Today is the current calendar day in India — midnight to midnight, Asia/Kolkata. Rank is the amount confirmed for that listing on Today since midnight IST. The board starts empty when the next day starts. Earlier days stay as history and do not carry onto the new day.</p>
        <p>Each category has its own board. Rank on a category board is the amount confirmed for that listing in that category.</p>
        <p>A free listing, when one is approved, sits after every paid row and is labelled Free listing. It is not a rank bought with a payment.</p>
      </LegalSection>

      <LegalSection title="How ranking works">
        <p>New paid ranks are whole rupees, ₹99 minimum, ₹10,00,000 maximum, ₹1 at a time. A rank already on the board keeps its amount until that listing raises it.</p>
        <p>To place above another listing, the amount must be at least ₹1 more than that listing&apos;s rank amount. An equal amount stays in the order the payments were confirmed — the earlier listing keeps the higher rank. If the confirmation time also matches, the smaller listing id keeps the higher rank.</p>
        <p>Taking #1 costs at least ₹1 more than the current #1 on that board, and at least ₹99. Paying less still puts you on the board at whatever rank that amount can take. The rank shown before you pay is a preview. It is assigned when payment is confirmed, at whatever position that amount then supports.</p>
        <p>Already on the list? Submit the same URL or @handle again and raise the rank. The new amount must be at least ₹10 above the current rank amount, and it replaces that amount. Checkout charges the amount you enter. Someone else cannot take your rank by paying only the gap between your old amount and a new one. They have to pay a full rank amount at least ₹1 above yours.</p>
        <p>A later smaller payment never lowers a rank. If a confirmed payment cannot raise the current amount, it is not applied, and the order is handled under the <Link className="text-brand underline" href="/refunds">Refunds</Link> page.</p>
        <p>Links are stored by host and path, so two different pages do not share a rank. Tracking parameters such as utm, fbclid, and gclid are removed. Link-shortener domains are rejected.</p>
      </LegalSection>

      <LegalSection title="What you can list">
        <p>A public product website, profile, or other destination in an open category, or an X @handle, that you own or are authorised to represent.</p>
        <p>Chat and invite links are not allowed — Telegram, WhatsApp, Discord, Messenger, Signal, and similar. The board is for products, profiles, and public work, not group chats.</p>
        <p>Links to sexual content are not allowed. If it is porn, NSFW, or an adult platform, it does not belong on the board.</p>
        <p>Affiliate and tracking parameters are stripped from listing links. Link-shortener URLs are not allowed.</p>
        <p>A commercial website should show who operates it: a legal name and a working way to contact that operator. A personal profile, collection, or achievement is a claim by the person who listed it. We do not check that claim before it appears.</p>
      </LegalSection>

      <LegalSection title="Categories">
        <p>You choose one category when you list. Category boards rank only the amounts paid on that category. If a listing is in the wrong category, use the <Link className="text-brand underline" href="/contact">contact page</Link>. We may move it.</p>
      </LegalSection>

      <LegalSection title="After you pay">
        <p>Your listing is public. Clicks go to the URL or profile you submitted, without tracking parameters.</p>
        <p>A completed payment is what claims the rank. A payment that has been applied to a rank is not refundable. The cases that can be refunded are on the <Link className="text-brand underline" href="/refunds">Refunds</Link> page.</p>
        <p>
          Paying means you agree to the <Link className="text-brand underline" href="/terms">Terms of Service</Link> and <Link className="text-brand underline" href="/privacy">Privacy Policy</Link>, including the rule that you may only list a destination you are allowed to represent.
        </p>
      </LegalSection>

      <p className="text-sm leading-7 text-secondary">
        <Link className="underline" href="/faq">FAQ</Link>
        {" · "}
        <Link className="underline" href="/terms">Terms</Link>
        {" · "}
        <Link className="underline" href="/privacy">Privacy</Link>
        {" · "}
        <Link className="underline" href="/refunds">Refunds</Link>
        {" · "}
        <Link className="underline" href="/about">About</Link>
      </p>
    </LegalDocument>
  );
}

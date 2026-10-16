import Link from "next/link";
import { site } from "@/config/site";
import { LegalDocument, LegalSection } from "@/content/legal";

export function FaqDocument() {
  return (
    <LegalDocument title="FAQ">
      <p className="text-sm leading-7 text-secondary">
        Common questions about {site.domain} — how the public leaderboard works, what a rank costs, and what you can list. The <Link className="text-brand underline" href="/rules">rules</Link> and <Link className="text-brand underline" href="/terms">terms</Link> are the source of truth if anything here conflicts.
      </p>

      <LegalSection title={`What is ${site.domain}?`}>
        <p>{site.name} is a public leaderboard where rank is what you pay, in Indian rupees. There are no third-party ads, no API for sale, and no revenue share. You list a public website, profile, or other allowed destination, pay a rank amount, and sit above everyone who paid less on that board.</p>
        <p>It is a labelled advertisement. It is not an auction, a bidding platform, a review, or a community vote.</p>
        <p><Link className="underline" href="/">All-time board</Link> · <Link className="underline" href="/about">About</Link></p>
      </LegalSection>

      <LegalSection title={`How does ${site.name} work?`}>
        <p>Paste a public URL or X handle, pick a category and a board, and pay. A completed payment claims the rank. New ranks start at ₹99. To place above another listing, pay at least ₹1 more than that listing. Paying less still puts you on the board at whatever rank that amount can take. Equal amounts stay in the order they were confirmed — the earlier listing keeps the higher rank.</p>
        <p><Link className="underline" href="/rules">Rules</Link></p>
      </LegalSection>

      <LegalSection title={`How much does it cost to rank on ${site.name}?`}>
        <p>New ranks are whole rupees, ₹99 minimum, ₹10,00,000 maximum, ₹1 at a time. Taking first place costs at least ₹1 more than the current #1, and at least ₹99. If you are already on that board, the new amount must be at least ₹10 above your current rank amount. Checkout charges the amount you enter. That amount becomes the rank.</p>
        <p><Link className="underline" href="/rules">How ranking works</Link></p>
      </LegalSection>

      <LegalSection title={`How do I get #1 on ${site.name}?`}>
        <p>Pay at least ₹1 more than whoever is currently #1 on that board. On All-time that is the highest amount confirmed for a listing on All-time. On Today it is the highest amount confirmed on Today since midnight IST. On a category board it is the highest amount confirmed in that category. Rank is assigned when payment is confirmed, at whatever position that amount then supports.</p>
        <p><Link className="underline" href="/">All-time</Link> · <Link className="underline" href="/leaderboard/today">Today</Link></p>
      </LegalSection>

      <LegalSection title="What is the difference between All-time, Today, and a category board?">
        <p>You choose one board when you pay. All-time is the amount confirmed for that listing on All-time, and it does not expire. Today is the current IST calendar day — midnight to midnight. It starts empty at the next midnight. Category boards rank the amount confirmed inside that category. A payment on one board does not buy a rank on the others.</p>
        <p><Link className="underline" href="/">All-time</Link> · <Link className="underline" href="/leaderboard/today">Today</Link> · <Link className="underline" href="/categories">Categories</Link></p>
      </LegalSection>

      <LegalSection title="Can I raise my rank after I already paid?">
        <p>Yes. Enter the same URL or @handle again. The new amount must be at least ₹10 above your current rank on that board, and it replaces that amount. Checkout charges the new amount. Someone else cannot take your rank by paying only the gap. They must pay a full amount at least ₹1 above your rank.</p>
        <p><Link className="underline" href="/rules">Rules</Link></p>
      </LegalSection>

      <LegalSection title={`Are payments on ${site.name} refundable?`}>
        <p>A payment that has been applied to a rank is final. Being placed lower later, a reset of Today at midnight IST, fewer clicks than you hoped for, or a later removal for breaking the rules does not create a refund.</p>
        <p>If a confirmed payment cannot be applied because it does not raise the current rank, the rank is left as it is and the order is refunded. A mandatory right under the Consumer Protection Act, 2019 still applies where the service was not provided.</p>
        <p><Link className="underline" href="/refunds">Refunds</Link> · <Link className="underline" href="/terms">Terms of Service</Link></p>
      </LegalSection>

      <LegalSection title={`What can I list on ${site.name}?`}>
        <p>A public website, profile, or other destination in an open category, or an X @handle, that you own or are authorised to represent. Chat and invite links are not allowed — Telegram, WhatsApp, Discord, Messenger, Signal, and similar. Sexual content, NSFW, and adult platforms are not allowed. Tracking parameters are stripped. Link shorteners are rejected. A commercial website should show who operates it.</p>
        <p><Link className="underline" href="/rules">What you can list</Link></p>
      </LegalSection>

      <LegalSection title={`How do categories work on ${site.name}?`}>
        <p>Every listing sits in one category, such as websites, profiles, vehicles, or creative work. You pick the category when you list. If it is wrong, use the contact page and we may move it. Category boards have their own rankings.</p>
        <p><Link className="underline" href="/categories">Browse categories</Link></p>
      </LegalSection>

      <LegalSection title="Can I list without paying?">
        <p>Yes. A free listing can be submitted for review. If it is approved, it appears after every paid row and is labelled Free listing. It does not hold a paid rank.</p>
      </LegalSection>

      <LegalSection title={`How do I pay for a ranking on ${site.name}?`}>
        <p>Checkout runs through Razorpay when live payments are on. You choose a whole-rupee amount, accept the terms, and pay. Rank is claimed when payment is confirmed. Card, UPI, and other payment details are collected by Razorpay, not by {site.name}. In sandbox mode the checkout is a test and is not a bank charge.</p>
        <p><Link className="underline" href="/">Claim a rank</Link> · <Link className="underline" href="/privacy">Privacy Policy</Link></p>
      </LegalSection>

      <LegalSection title={`Do rankings on ${site.name} expire?`}>
        <p>All-time ranks do not expire. Today ranks reset at midnight IST. Category ranks stay until that listing raises them, they are removed, or the rules change.</p>
        <p><Link className="underline" href="/">All-time</Link> · <Link className="underline" href="/leaderboard/today">Today</Link></p>
      </LegalSection>

      <LegalSection title="What happens if someone else pays while I am checking out?">
        <p>Rank is assigned when your payment is confirmed, at whatever position that amount then supports. If someone else paid more while you were in checkout, you still land on the board — at the rank that amount can take. The preview is not reserved.</p>
        <p><Link className="underline" href="/terms">Terms of Service</Link></p>
      </LegalSection>

      <LegalSection title={`How is ${site.name} different from a launch directory?`}>
        <p>{site.name} is not a launch vote. There is no upvote and no review score. Rank is only the amount paid on that board. The board is public, paid ranks stay visible on the terms above, and a free listing never sorts above a paid rank.</p>
        <p><Link className="underline" href="/">Leaderboard</Link> · <Link className="underline" href="/rules">Rules</Link></p>
      </LegalSection>

      <LegalSection title={`How do I contact ${site.name} or report a listing?`}>
        <p>Use the <Link className="text-brand underline" href="/contact">contact page</Link> for category corrections, listing notices, payment questions, and privacy requests. Grievances are acknowledged within 48 hours.</p>
      </LegalSection>
    </LegalDocument>
  );
}

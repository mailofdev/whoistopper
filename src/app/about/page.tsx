import { Suspense } from "react";
import { Alert, Skeleton } from "@/components/ui/primitives";
import { site } from "@/config/site";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { formatInrFromPaise } from "@/lib/money";
import { getServices } from "@/lib/services";

export const metadata = pageMetadata(
  "About",
  "RankPush is a public leaderboard. Rank is the amount you pay in INR. It is a labelled advertisement, not an auction or a review.",
  "/about",
);

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <About />
    </Suspense>
  );
}

async function About() {
  let paid = 0;
  let listed = 0;
  let categories = 0;
  let highest = 0;
  let notice = "";
  try {
    const services = getServices();
    const [categoryList, board] = await Promise.all([
      services.categories.list(),
      services.leaderboards.get({ type: "all_time", key: "all_time" }, 1, 1),
    ]);
    categories = categoryList.filter((category) => category.isActive).length;
    paid = board.paidCount;
    listed = board.total;
    highest = board.entries.find((entry) => entry.placement === "paid" && entry.amountPaise)?.amountPaise ?? 0;
  } catch (error) {
    notice = toPublicError(error).message;
  }

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">About</h1>
        <p className="mt-4 leading-7 text-secondary">
          {site.name} is a public leaderboard. There are no third-party ads, no API for sale, and no revenue share. You pay to stand above everyone else. Rank is what you pay — nothing else.
        </p>
        <p className="mt-3 leading-7 text-secondary">
          A paid rank is a labelled advertisement priced in Indian rupees. It is not an auction, a bidding platform, a review, a rating, or an endorsement.
        </p>
      </header>
      <section className="space-y-3 leading-7 text-secondary">
        <h2 className="text-xl font-semibold text-navy">What you are paying for</h2>
        <p>You can pay to list a public website, profile, or other allowed destination and to occupy a rank based on the amount paid, under the published Rules. You choose one board. Someone else can pay more on that board and place above you.</p>
        <p>All-time keeps the confirmed amount for that listing and does not expire. Today only counts amounts confirmed since midnight IST, and starts empty the next day. Each category has its own board. A free listing, if approved, sits after every paid row.</p>
      </section>
      {notice ? <Alert>{notice}</Alert> : (
        <section className="grid gap-3 sm:grid-cols-3">
          <Stat value={String(listed)} label="listings on the all-time board" />
          <Stat value={String(paid)} label="paid ranks" />
          <Stat value={highest ? formatInrFromPaise(highest) : "—"} label="highest all-time rank" />
          <Stat value={String(categories)} label="categories" />
          <Stat value="₹99" label="minimum new rank" />
          <Stat value="00:00 IST" label="when Today resets" />
        </section>
      )}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">From the rules, in short</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Note title="Rank is the amount" body="The position follows the confirmed payment. It does not mean we checked the product or liked it." />
          <Note title="Someone can pay more" body="A higher confirmed amount takes the place above you. The preview is not reserved while you are paying." />
          <Note title="Today starts over" body="The daily board uses the IST date. Yesterday stays in history and does not carry onto the new day." />
        </div>
      </section>
    </article>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass rounded-2xl px-4 py-4">
      <p className="text-2xl font-semibold text-navy">{value}</p>
      <p className="mt-1 text-sm text-secondary">{label}</p>
    </div>
  );
}

function Note({ title, body }: { title: string; body: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-secondary">{body}</p>
    </div>
  );
}

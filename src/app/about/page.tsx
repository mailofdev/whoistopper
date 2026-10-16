import { Suspense } from "react";
import { Alert, Skeleton } from "@/components/ui/primitives";
import { site } from "@/config/site";
import { articles } from "@/content/articles";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { formatInrFromPaise } from "@/lib/money";
import { getServices } from "@/lib/services";

export const metadata = pageMetadata(articles.about.title, articles.about.description, "/about");

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
          {site.name} is a paid public ranking for products, websites, and tools. A rank is the verified amount in INR. It is a labelled advertisement, not a review, a rating, or an endorsement.
        </p>
      </header>
      <section className="space-y-3 leading-7 text-secondary">
        <h2 className="text-xl font-semibold text-navy">What you are paying for</h2>
        <p>You can pay to list a product website or an X profile and to occupy a rank based on the amount paid, under the published Rules. Someone else can pay more and move ahead of you.</p>
        <p>Today&apos;s board only counts spend since midnight UTC. All-time keeps every confirmed bid. Each category has its own board.</p>
      </section>
      {notice ? <Alert>{notice}</Alert> : (
        <section className="grid gap-3 sm:grid-cols-3">
          <Stat value={String(listed)} label="listings on the all-time board" />
          <Stat value={String(paid)} label="paid ranks" />
          <Stat value={highest ? formatInrFromPaise(highest) : "—"} label="highest all-time rank" />
          <Stat value={String(categories)} label="categories" />
          <Stat value="₹99" label="minimum new bid" />
          <Stat value="00:00 UTC" label="when Today resets" />
        </section>
      )}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">From the rules, in short</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Note title="A rank is a payment" body="The position follows the confirmed amount. It does not mean we checked the product or liked it." />
          <Note title="Someone can outbid you" body="A higher confirmed bid takes the place above you. The rank is not reserved while you are paying." />
          <Note title="Today starts over" body="The daily board uses the UTC date. Yesterday stays in history and does not carry onto the new day." />
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

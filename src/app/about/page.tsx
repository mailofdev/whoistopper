import { Suspense } from "react";
import { Alert, Skeleton } from "@/components/ui/primitives";
import { site } from "@/config/site";
import { PACKAGE_DEFAULTS } from "@/config/packages";
import { toPublicError } from "@/lib/errors";
import { pageMetadata } from "@/lib/metadata";
import { formatInrFromPaise } from "@/lib/money";
import { getServices } from "@/lib/services";

export const metadata = pageMetadata(
  "About",
  "RankPush is a public directory. Fixed-price advertisements are labelled and are not a rating or an endorsement.",
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
  let listed = 0;
  let categories = 0;
  let notice = "";
  try {
    const services = getServices();
    const [categoryList, board] = await Promise.all([
      services.categories.list(),
      services.leaderboards.get({ type: "all_time", key: "all_time" }, 1, 1),
    ]);
    categories = categoryList.filter((category) => category.isActive).length;
    listed = board.total;
  } catch (error) {
    notice = toPublicError(error).message;
  }

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">About</h1>
        <p className="mt-4 leading-7 text-secondary">
          {site.name} is a public directory of websites, digital products, creator profiles, and other permitted destinations. There is no auction, no bidding, and no pay-more-to-move-ahead.
        </p>
        <p className="mt-3 leading-7 text-secondary">
          An advertisement is a fixed package with a disclosed price, place, and duration. It is not a review, a rating, or an endorsement, and it does not promise traffic or sales.
        </p>
      </header>
      {notice ? <Alert>{notice}</Alert> : (
        <section className="grid gap-3 sm:grid-cols-3">
          <Stat value={String(listed)} label="listings in the directory sample" />
          <Stat value={String(categories)} label="active categories" />
          <Stat value={formatInrFromPaise(PACKAGE_DEFAULTS[0].pricePaise)} label="current daily package test price" />
        </section>
      )}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How placement works</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Note title="Organic listings" body="Approved listings stay in the directory, newest approval first, then name. Spend does not change that order." />
          <Note title="Fixed packages" body="Daily, weekly, and category packages say where the advertisement appears and how long it runs." />
          <Note title="Shared slots" body="When several advertisements share a place, the earlier activation stays ahead. A larger payment does not jump the queue." />
        </div>
      </section>
      <p className="text-sm leading-7 text-secondary">The prices shown are the current test configuration. Live charges stay off until the payment provider approves this model. This page is not legal advice.</p>
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

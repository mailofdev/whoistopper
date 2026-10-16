import type { ReactNode } from "react";

export function LegalDocument({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      {updated ? <p className="mt-3 text-sm text-secondary">{updated}</p> : null}
      <div className="mt-8 space-y-8 text-sm leading-7 text-secondary">{children}</div>
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-navy">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-secondary">{children}</div>
    </section>
  );
}

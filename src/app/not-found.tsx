import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-sm text-secondary">That address is not a public listing or page.</p>
      <Link className="mt-6 inline-flex h-11 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white" href="/">Back home</Link>
    </div>
  );
}

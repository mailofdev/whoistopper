"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-12 text-center" role="alert">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-sm text-secondary">The page could not be loaded. You can try again.</p>
      <button className="mt-6 h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand" onClick={() => reset()} type="button">Try again</button>
    </div>
  );
}

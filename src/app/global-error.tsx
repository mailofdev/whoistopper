"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <h1>Who&apos;s Topper is unavailable</h1>
        <button type="button" onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}

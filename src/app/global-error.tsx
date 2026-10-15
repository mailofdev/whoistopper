"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: "sans-serif", padding: "2rem", background: "#fff6f8", color: "#241018" }}>
        <h1>RankPush is unavailable</h1>
        <button type="button" onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}

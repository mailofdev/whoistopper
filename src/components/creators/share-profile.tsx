"use client";

import { useState } from "react";

export function ShareProfile({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="inline-flex h-11 items-center justify-center rounded-full bg-muted px-4 text-sm font-semibold text-navy"
      onClick={async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
            return;
          } catch {
            return;
          }
        }
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }}
    >
      {copied ? "Link copied" : "Share profile"}
    </button>
  );
}

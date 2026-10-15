import type { Metadata } from "next";
import { site, siteUrl } from "@/config/site";

export function pageMetadata(title: string, description: string, path: string, index = true): Metadata {
  const url = `${siteUrl()}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      locale: "en_IN",
      type: "website",
      images: [{ url: "/brand/og.svg", width: 1200, height: 630, alt: site.name }],
    },
  };
}

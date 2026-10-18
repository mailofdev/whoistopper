const TRACKING_PARAM = /^(utm_|fbclid$|gclid$|mc_eid$|igshid$)/i;
const SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "cutt.ly",
  "rb.gy",
]);

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "product";
}

/** Browser-safe IP check. `node:net` cannot be imported from client components. */
function isIpHost(host: string): boolean {
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) return true;
  return host.includes(":") && /^[0-9a-f:]+$/i.test(host);
}

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host || !host.includes(".")) return true;
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (isIpHost(host)) return true;
  if (SHORTENERS.has(host)) return true;
  return false;
}

/** Canonical https URL used for duplicate detection and outbound links. */
export function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 300) {
    throw new Error("Enter a website URL.");
  }
  if (/^(javascript|data|file|vbscript|blob):/i.test(trimmed)) {
    throw new Error("Only http and https links are allowed.");
  }
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error("Enter a valid website URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https links are allowed.");
  }
  if (url.username || url.password) {
    throw new Error("URLs with embedded credentials are not allowed.");
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  if (isBlockedHostname(host)) {
    throw new Error("Enter a public website domain. Shorteners and private hosts are blocked.");
  }
  const kept = new URLSearchParams();
  for (const [key, value] of [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (TRACKING_PARAM.test(key)) continue;
    kept.append(key, value);
  }
  const path = decodeURI(url.pathname).replace(/\/+$/, "");
  const search = kept.toString();
  return `https://${host}${path}${search ? `?${search}` : ""}`;
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
  } catch {
    return false;
  }
}

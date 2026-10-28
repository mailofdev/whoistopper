/** Store only the referrer hostname. Full referrer URLs can carry tokens. */
export function referralHost(referer: string | null, siteHost: string): string | null {
  if (!referer) return null;
  let url: URL;
  try {
    url = new URL(referer);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  const own = siteHost.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  if (!host || host.length > 253 || host === own || host.endsWith(`.${own}`)) return null;
  if (!/^[a-z0-9.-]+$/.test(host) || !host.includes(".")) return null;
  return host;
}

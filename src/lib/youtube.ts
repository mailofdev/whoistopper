/** Accept only a public YouTube watch, embed, shorts, or youtu.be id. */
export function youtubeId(value: string | undefined): string | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const idPattern = /^[\w-]{11}$/;
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return idPattern.test(id) ? id : null;
  }
  if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "youtube-nocookie.com") return null;
  const watch = url.searchParams.get("v") ?? "";
  if (idPattern.test(watch)) return watch;
  const parts = url.pathname.split("/").filter(Boolean);
  const nested = parts[0] === "embed" || parts[0] === "shorts" ? parts[1] ?? "" : "";
  return idPattern.test(nested) ? nested : null;
}

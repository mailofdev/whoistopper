const BOT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegrambot|headless|lighthouse|pingdom|uptimerobot|wget|curl\//i;

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return BOT.test(userAgent);
}

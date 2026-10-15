export function formatInrFromPaise(paise: number): string {
  const fractionDigits = paise % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(paise / 100);
}

export function rupeesToPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) {
    throw new Error("Amount must be a finite number of rupees.");
  }
  return Math.round(rupees * 100);
}

export function isWholePaise(paise: number): boolean {
  return Number.isInteger(paise) && paise > 0;
}

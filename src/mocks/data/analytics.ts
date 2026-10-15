/** Deterministic daily counts so search, charts, and trending do not depend on Math.random. */
export function sampleCount(productNumber: number, dayIndex: number, kind: "views" | "clicks"): number {
  if (kind === "views") return 2 + ((productNumber * 5 + dayIndex * 3) % 18);
  return (productNumber + dayIndex) % 4 === 0 ? 1 + (productNumber % 3) : 0;
}

/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductCard } from "@/components/products/product-card";
import type { ProductCardModel } from "@/types/domain";

const base: ProductCardModel = {
  id: "30000000-0000-4000-8000-000000000001",
  slug: "nadi-payroll",
  name: "Nadi Payroll",
  shortDescription: "Payroll for small Indian teams with a short public summary.",
  categoryName: "Fintech",
  categorySlug: "fintech",
  tags: ["payroll"],
  placement: "paid",
  rank: 1,
  amountPaise: 500000,
  ownershipVerified: true,
  approvedAt: "2026-09-01T00:00:00.000Z",
};

describe("ProductCard", () => {
  it("labels a paid placement separately from a free listing", () => {
    const { rerender } = render(<ProductCard product={base} showRank />);
    expect(screen.getByText("Paid placement")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    rerender(<ProductCard product={{ ...base, placement: "free", rank: null, amountPaise: null }} />);
    expect(screen.getByText("Free listing")).toBeTruthy();
    expect(screen.queryByText("Paid placement")).toBeNull();
  });
});

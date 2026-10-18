/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FaqDocument } from "@/content/faq-document";
import { PrivacyDocument } from "@/content/privacy-document";
import { RefundsDocument } from "@/content/refunds-document";
import { RulesDocument } from "@/content/rules-document";
import { TermsDocument } from "@/content/terms-document";

describe("directory policy pages", () => {
  it("describes fixed-price advertising on the rules and FAQ", () => {
    const rules = render(<RulesDocument />);
    expect(rules.getByRole("heading", { name: "Rules" })).toBeTruthy();
    expect(rules.getByText(/no auction/i)).toBeTruthy();
    rules.unmount();

    const faq = render(<FaqDocument />);
    expect(faq.getByRole("heading", { name: "Is RankPush an auction or bidding website?" })).toBeTruthy();
    expect(faq.getAllByText("No.").length).toBeGreaterThan(0);
    faq.unmount();
  });

  it("keeps terms, privacy, and refunds on the same product", () => {
    const terms = render(<TermsDocument />);
    expect(terms.getByText(/fixed-price advertising packages/i)).toBeTruthy();
    expect(terms.getAllByText(/to be completed by the operator/i).length).toBeGreaterThan(0);
    terms.unmount();

    const privacy = render(<PrivacyDocument />);
    expect(privacy.getByText(/does not store card numbers/i)).toBeTruthy();
    expect(privacy.getByText(/contact email/i)).toBeTruthy();
    privacy.unmount();

    const refunds = render(<RefundsDocument />);
    expect(refunds.getByText(/rejected before the campaign is activated/i)).toBeTruthy();
    expect(refunds.getByText(/do not publish a guaranteed number of days/i)).toBeTruthy();
  });
});

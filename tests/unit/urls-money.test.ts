import { describe, expect, it } from "vitest";
import { normalizeWebsiteUrl, slugify } from "@/lib/urls";
import { formatInrFromPaise, rupeesToPaise } from "@/lib/money";

describe("urls and money", () => {
  it("canonicalises hosts, strips tracking params, and blocks dangerous urls", () => {
    expect(normalizeWebsiteUrl("HTTP://WWW.Example.com/app/?utm_source=x&ref=board")).toBe("https://example.com/app?ref=board");
    expect(slugify("Nadi Payroll!")).toBe("nadi-payroll");
    expect(() => normalizeWebsiteUrl("javascript:alert(1)")).toThrow(/http/i);
    expect(() => normalizeWebsiteUrl("https://user:pass@example.com")).toThrow(/credential/i);
    expect(() => normalizeWebsiteUrl("https://bit.ly/abcd")).toThrow(/public website/i);
    expect(() => normalizeWebsiteUrl("http://127.0.0.1/admin")).toThrow(/public website/i);
  });

  it("formats INR from paise and converts rupees without binary drift", () => {
    expect(formatInrFromPaise(9900)).toBe("₹99");
    expect(formatInrFromPaise(500050)).toBe("₹5,000.50");
    expect(rupeesToPaise(99)).toBe(9900);
    expect(rupeesToPaise(10.5)).toBe(1050);
  });
});

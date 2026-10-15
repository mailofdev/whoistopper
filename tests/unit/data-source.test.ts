import { describe, expect, it } from "vitest";
import { resolveMockDataEnabled } from "@/config/data-source";

describe("mock data guard", () => {
  it("rejects mock mode in production even when the public flag is true", () => {
    expect(resolveMockDataEnabled({ NODE_ENV: "production", NEXT_PUBLIC_USE_MOCK_DATA: "true" })).toBe(false);
  });

  it("defaults to mock data in development when the flag is omitted", () => {
    expect(resolveMockDataEnabled({ NODE_ENV: "development" })).toBe(true);
  });

  it("lets development turn mock data off", () => {
    expect(resolveMockDataEnabled({ NODE_ENV: "development", NEXT_PUBLIC_USE_MOCK_DATA: "false" })).toBe(false);
  });

  it("stays off in test unless explicitly enabled", () => {
    expect(resolveMockDataEnabled({ NODE_ENV: "test" })).toBe(false);
    expect(resolveMockDataEnabled({ NODE_ENV: "test", NEXT_PUBLIC_USE_MOCK_DATA: "true" })).toBe(true);
  });
});

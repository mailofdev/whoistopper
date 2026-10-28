import { expect, test } from "@playwright/test";

test("home introduces RankPush", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Launch a profile people can actually find." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Launch your profile" })).toBeVisible();
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByLabel("Search products")).toBeVisible();
});

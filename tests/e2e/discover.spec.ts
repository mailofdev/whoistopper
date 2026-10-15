import { expect, test } from "@playwright/test";

test("home shows the public rank board", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "All-time" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Claim rank" })).toBeDisabled();
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByLabel("Search products")).toBeVisible();
});

import { expect, test } from "@playwright/test";

test("home shows the directory", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "Directory" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Submit a listing" })).toBeVisible();
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByLabel("Search products")).toBeVisible();
});

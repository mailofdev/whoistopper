import { expect, test } from "@playwright/test";

test("home explains paid placement and opens search", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /pay in rupees/i })).toBeVisible();
  await expect(page.getByText("MOCK DATA")).toBeVisible();
  await page.getByRole("link", { name: "Search" }).first().click();
  await expect(page).toHaveURL(/\/search/);
  await page.getByLabel("Search").fill("Nadi");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("link", { name: "Nadi Payroll" })).toBeVisible();
});

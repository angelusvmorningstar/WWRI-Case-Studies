import { test, expect } from "@playwright/test";

test.describe("M Suite Smoke Tests", () => {
  test("home page loads with M Suite branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.getByText("M Suite")).toBeVisible();
    await expect(page.getByText("My Opportunities")).toBeVisible();
  });

  test("home page shows empty state with New Opportunity button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("No opportunities yet")).toBeVisible();
    await expect(page.getByRole("button", { name: "New Opportunity" }).first()).toBeVisible();
  });

  test("WWRI design tokens are applied", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");
    const bgColor = await body.evaluate((el) => getComputedStyle(el).backgroundColor);
    // #F5F4F0 = rgb(245, 244, 240)
    expect(bgColor).toBe("rgb(245, 244, 240)");
  });

  test("nav bar is sticky and 56px tall", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    const height = await nav.evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBe(56);
    const position = await nav.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe("sticky");
  });
});

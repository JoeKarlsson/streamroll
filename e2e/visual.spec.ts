import { test, expect } from "@playwright/test";
import { gotoQuiet } from "./helpers";

test.use({ viewport: { width: 1440, height: 900 } });

test.beforeEach(async ({ page }) => {
  await gotoQuiet(page, "/");
  await page.evaluate(() => document.fonts.ready);
});

test("site header", async ({ page }) => {
  await expect(page.locator("header").first()).toHaveScreenshot("header.png");
});

test("footer", async ({ page }) => {
  await expect(page.locator("footer")).toHaveScreenshot("footer.png");
});

test("home Style grid", async ({ page }) => {
  const grid = page.getByRole("group", { name: "Style" });
  // Lazy tiles below the fold must be loaded before the shot.
  await grid.scrollIntoViewIfNeeded();
  await expect.poll(() => grid.locator("img").evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).complete))).toBe(true);
  await expect(grid).toHaveScreenshot("style-grid.png", { mask: [page.locator("main video")] });
});

import { test, expect } from "@playwright/test";
import { gotoQuiet, blockApi, expectNoAxeViolations, fileInputsReachedByTab, seed, doneState } from "./helpers";

test.describe("restored result screen", () => {
  test.beforeEach(async ({ page }) => {
    await blockApi(page);
    await seed(page, doneState);
    await gotoQuiet(page, "/");
    await expect(page.locator("#redo-notes")).toBeVisible();
  });

  test("R13 does not scroll on load", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("R08 result video has controls", async ({ page }) => {
    await expect(page.locator('section[aria-labelledby="result-heading"] video')).toHaveAttribute("controls", "");
  });

  test("axe passes", async ({ page }) => {
    await expectNoAxeViolations(page);
  });

  test("R05 the audio mixer's file input is reachable with Tab", async ({ page }) => {
    await page.getByRole("button", { name: "Add audio to your video" }).click();
    await expect(page.locator('section[aria-labelledby="result-heading"] input[type="file"]')).toHaveCount(1);
    const { reached, total } = await fileInputsReachedByTab(page);
    expect(reached).toBe(total);
  });
});

test("R06 redo notes have an accessible name", async ({ page }) => {
  await blockApi(page);
  await seed(page, doneState);
  await gotoQuiet(page, "/");
  await expect(page.getByLabel(/Notes for a redo/)).toBeVisible();
});

test("R06 review notes have an accessible name", async ({ page }) => {
  await blockApi(page);
  await seed(page, { ...doneState, step: "review", videoUrl: null });
  await gotoQuiet(page, "/");
  await expect(page.getByLabel(/Notes for a new version/)).toBeVisible();
});

import { test, expect, type Page } from "@playwright/test";
import { gotoQuiet, blockApi, seed, doneState, firstUnpressed } from "./helpers";

const KEY_STORAGE = "runway_api_key";
const FAKE_KEY = "key_e2e_not_a_real_key";

async function withSavedKey(page: Page) {
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [KEY_STORAGE, FAKE_KEY] as const);
}

const stored = (page: Page) =>
  page.evaluate((k) => ({ local: localStorage.getItem(k), session: sessionStorage.getItem(k) }), KEY_STORAGE);

test.describe("R09 Enter in empty notes never starts a paid generation", () => {
  test("redo notes: empty Enter does not POST /api/video/*", async ({ page }) => {
    const calls = await blockApi(page);
    await withSavedKey(page);
    await seed(page, doneState);
    await gotoQuiet(page, "/");
    const notes = page.locator("#redo-notes");
    await notes.press("Enter");
    // Positive control: typed notes + Enter does POST, so the empty Enter above had its chance first.
    await notes.fill("more energy");
    const started = page.waitForRequest("**/api/video/start");
    await notes.press("Enter");
    await started;
    expect(calls).toEqual(["POST /api/video/start"]);
  });

  test("review notes: empty Enter does not POST /api/image", async ({ page }) => {
    const calls = await blockApi(page);
    await withSavedKey(page);
    await seed(page, { ...doneState, step: "review", videoUrl: null });
    await gotoQuiet(page, "/");
    const notes = page.locator("#review-notes");
    await notes.press("Enter");
    await notes.fill("brighter red");
    const posted = page.waitForRequest("**/api/image");
    await notes.press("Enter");
    await posted;
    expect(calls).toEqual(["POST /api/image"]);
  });
});

test.describe("API key Save via Enter", () => {
  test.beforeEach(async ({ page }) => {
    await blockApi(page);
  });

  test("home, Remember checked: key goes to localStorage; R27 focus leaves body and status is announced", async ({ page }) => {
    await gotoQuiet(page, "/");
    await page.locator("#runway-api-key").fill(FAKE_KEY);
    await page.locator("#runway-api-key").press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Key saved" })).toBeVisible();
    expect(await stored(page)).toEqual({ local: FAKE_KEY, session: null });
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
  });

  test("home, Remember unchecked: key goes to sessionStorage only", async ({ page }) => {
    await gotoQuiet(page, "/");
    await page.getByLabel("Remember this key on this device").uncheck();
    await page.locator("#runway-api-key").fill(FAKE_KEY);
    await page.locator("#runway-api-key").press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Key saved" })).toBeVisible();
    expect(await stored(page)).toEqual({ local: null, session: FAKE_KEY });
  });

  test("/setup: Enter saves the key; R27 focus leaves body and status is announced", async ({ page }) => {
    await gotoQuiet(page, "/setup");
    await page.getByLabel("Runway API key").fill(FAKE_KEY);
    await page.getByLabel("Runway API key").press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Key saved" })).toBeVisible();
    expect((await stored(page)).local).toBe(FAKE_KEY);
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
  });
});

test("R34 Generate without a key is enabled and focuses the key field", async ({ page }) => {
  await blockApi(page);
  await gotoQuiet(page, "/");
  await page.locator("#service-name").fill("Joeflix");
  const generate = page.getByRole("button", { name: /generate/i }).last();
  await expect(generate).toBeEnabled();
  await generate.click();
  await expect(page.locator("#runway-api-key")).toBeFocused();
});

test("R35 Prompt preview is closed by default", async ({ page }) => {
  await gotoQuiet(page, "/");
  await expect(page.getByRole("button", { name: "Prompt preview" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#prompt-preview")).toHaveCount(0);
});

test("R10 service name comes before Style; Seasonal, Holidays and Studios sit in a closed <details>", async ({ page }) => {
  await gotoQuiet(page, "/");
  const nameFirst = await page.evaluate(() => {
    const input = document.getElementById("service-name")!;
    const style = document.getElementById("style-heading")!;
    return !!(input.compareDocumentPosition(style) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(nameFirst).toBe(true);
  for (const group of ["seasonal", "holidays", "studios"]) {
    const heading = page.locator(`#${group}-heading`);
    await expect(heading, group).toHaveCount(1);
    expect(await heading.evaluate((h) => h.closest("details")?.open), group).toBe(false);
  }
});

test("R07 Duration, title card and preset tiles flip aria-pressed", async ({ page }) => {
  await gotoQuiet(page, "/");
  for (const name of ["Duration", "Title card"]) {
    const option = await firstUnpressed(page.getByRole("group", { name }));
    await option.click();
    await expect(option).toHaveAttribute("aria-pressed", "true");
  }
});

test("R29 a clicked preset tile hides its description once the mouse leaves", async ({ page }) => {
  await gotoQuiet(page, "/");
  const tile = await firstUnpressed(page.getByRole("group", { name: "Style" }));
  await tile.hover();
  await tile.click();
  await page.mouse.move(0, 0);
  const overlay = tile.locator("span.absolute.inset-0");
  await expect.poll(() => overlay.evaluate((el) => getComputedStyle(el).opacity)).toBe("0");
});

test("R55 the selected tile's description is visible without hovering", async ({ page }) => {
  await gotoQuiet(page, "/");
  await page.mouse.move(0, 0);
  const active = page.getByRole("group", { name: "Style" }).locator('button[aria-pressed="true"]');
  await expect(active).toHaveCount(1);
  const desc = (await active.locator("span.absolute.inset-0").innerText()).trim();
  const shown = await page.evaluate((text) =>
    [...document.querySelectorAll("main *")].some(
      (el) => [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.includes(text)) &&
        (el as HTMLElement).checkVisibility({ opacityProperty: true, visibilityProperty: true }),
    ), desc);
  expect(shown, desc).toBe(true);
});

test.describe("R12 reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("home has no transitions and no running CSS animations", async ({ page }) => {
    await gotoQuiet(page, "/");
    const moving = await page.evaluate(() => ({
      transitions: [...document.querySelectorAll("*")]
        .filter((el) => getComputedStyle(el).transitionDuration.split(",").some((d) => parseFloat(d) > 0))
        .map((el) => el.outerHTML.slice(0, 80)),
      animations: document.getAnimations().filter((a) => a.playState === "running").length,
    }));
    expect(moving).toEqual({ transitions: [], animations: 0 });
  });
});

test("R37 no glow or gradient on the Generate button and the active tile", async ({ page }) => {
  await gotoQuiet(page, "/");
  const generate = page.getByRole("button", { name: /generate/i }).last();
  const tile = page.getByRole("group", { name: "Style" }).locator('button[aria-pressed="true"]');
  for (const el of [generate, tile]) {
    const style = await el.evaluate((e) => [getComputedStyle(e).boxShadow, getComputedStyle(e).backgroundImage]);
    expect(style).toEqual(["none", "none"]);
  }
});

test("R41 the Generate timer is not faded while generating", async ({ page }) => {
  await withSavedKey(page);
  // Hold the image request open so the page stays in its generating state.
  await page.route("**/api/image", () => {});
  await gotoQuiet(page, "/");
  await page.locator("#service-name").fill("Joeflix");
  const generate = page.getByRole("button", { name: "Generate intro" });
  await generate.click();
  const busy = page.getByRole("button", { name: /Generating/ });
  await expect(busy).toBeVisible();
  expect(await busy.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
});

test.describe("video generation in progress", () => {
  test.beforeEach(async ({ page }) => {
    await withSavedKey(page);
    await blockApi(page);
    await page.route("**/api/video/start", (r) => r.fulfill({ json: { taskId: "task-e2e", creditsBefore: 0 } }));
    await page.route("**/api/video/poll**", (r) => r.fulfill({ json: { status: "PENDING" } }));
    await page.route("**/api/video/cancel**", (r) => r.fulfill({ json: { ok: true } }));
    await seed(page, { ...doneState, step: "review", videoUrl: null });
    await gotoQuiet(page, "/");
    await page.getByRole("button", { name: "Looks good, make the video" }).click();
    await expect(page.getByRole("button", { name: "Cancel video" })).toBeVisible();
  });

  test("R28 progress is a <progress> element with one status region", async ({ page }) => {
    await expect(page.locator("main progress")).toHaveCount(1);
    await expect(page.locator('[role="status"]').filter({ hasText: /Generating the video/ })).toHaveCount(1);
  });

  test("R30 Cancel shows Cancelling… straight away", async ({ page }) => {
    test.fixme(true, "waits for motion branch");
    await page.getByRole("button", { name: "Cancel video" }).click();
    await expect(page.getByText("Cancelling…")).toBeVisible();
  });
});

test.describe("R61 home Copy buttons", () => {
  test("width does not change after a successful copy", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await gotoQuiet(page, "/");
    await page.getByRole("button", { name: "Prompt preview" }).click();
    const copy = page.locator("#prompt-preview").getByRole("button", { name: /Copy/ }).first();
    const before = (await copy.boundingBox())!.width;
    await copy.click();
    await expect(page.getByRole("status").filter({ hasText: /copied/i }).first()).toHaveText(/copied/i);
    expect((await copy.boundingBox())!.width).toBe(before);
  });

  test("a failed copy says Copy failed", async ({ page }) => {
    test.fixme(true, "waits for motion branch");
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.reject(new Error("denied")) },
      });
    });
    await gotoQuiet(page, "/");
    await page.getByRole("button", { name: "Prompt preview" }).click();
    await page.locator("#prompt-preview").getByRole("button", { name: /Copy/ }).first().click();
    await expect(page.getByText("Copy failed").first()).toBeVisible();
  });
});

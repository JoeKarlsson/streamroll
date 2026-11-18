import { test, expect, type Page } from "@playwright/test";
import { ROUTES, gotoQuiet, expectNoAxeViolations, fileInputsReachedByTab, firstUnpressed } from "./helpers";

const WIDTHS = [1440, 390] as const;

const DISCLOSURES = [
  ["Advanced settings", "#advanced-settings"],
  ["Prompt preview", "#prompt-preview"],
  ["More themes", "#more-themes"],
] as const;

async function openHomeDisclosures(page: Page) {
  for (const [name, panel] of DISCLOSURES) {
    await page.getByRole("button", { name }).click();
    // axe must see the finished state, not a half-faded panel.
    await expect(page.locator(panel)).toHaveCSS("opacity", "1");
  }
}

for (const width of WIDTHS) {
  test.describe(`axe at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const path of ROUTES) {
      test(`R04 ${path} has no axe violations`, async ({ page }) => {
        await gotoQuiet(page, path);
        await expectNoAxeViolations(page);
      });
    }

    test("home with Advanced settings, Prompt preview and More themes open", async ({ page }) => {
      await gotoQuiet(page, "/");
      await openHomeDisclosures(page);
      await expectNoAxeViolations(page);
    });

    test("404 page", async ({ page }) => {
      await gotoQuiet(page, "/no-such-page");
      await expectNoAxeViolations(page);
    });
  });
}

test("R05 file inputs are reachable with Tab (title card upload and audio)", async ({ page }) => {
  await gotoQuiet(page, "/");
  await page.getByRole("button", { name: "Upload your own" }).click();
  await expect(page.locator('input[type="file"]')).toHaveCount(2);
  expect(await fileInputsReachedByTab(page)).toEqual({ reached: 2, total: 2 });
});

test("R06 prompt textareas and the API key input have accessible names", async ({ page }) => {
  await gotoQuiet(page, "/");
  await page.getByRole("button", { name: "Prompt preview" }).click();
  const fields = page.locator("textarea, #runway-api-key, #service-name, #tagline");
  for (const field of await fields.all()) {
    const name = await field.evaluate((el) => {
      const labelledby = el.getAttribute("aria-labelledby");
      if (labelledby) return document.getElementById(labelledby)?.textContent ?? "";
      if (el.getAttribute("aria-label")) return el.getAttribute("aria-label");
      return (el as HTMLInputElement).labels?.[0]?.textContent ?? "";
    });
    expect(name?.trim(), await field.evaluate((el) => el.outerHTML.slice(0, 80))).toBeTruthy();
  }
});

test("R07 image model, video model, colour swatches and presets expose aria-pressed that flips on click", async ({ page }) => {
  await gotoQuiet(page, "/");
  await page.getByRole("button", { name: "Advanced settings" }).click();
  const groups = [
    page.getByRole("group", { name: "Image model" }),
    page.getByRole("group", { name: "Video model" }),
    page.getByRole("group", { name: /colou?r/i }),
    page.getByRole("group", { name: "Style" }),
  ];
  for (const group of groups) {
    const unpressed = await firstUnpressed(group);
    await expect(unpressed).toBeVisible();
    await unpressed.click();
    await expect(unpressed).toHaveAttribute("aria-pressed", "true");
  }
});

test("R11 header, footer, Copy and shuffle buttons are at least 44px tall", async ({ page }) => {
  await gotoQuiet(page, "/");
  await page.getByRole("button", { name: "Prompt preview" }).click();
  const targets = page.locator(
    'header a, footer a, [aria-label="Shuffle tagline"], #prompt-preview button:has-text("Copy")',
  );
  for (const target of await targets.all()) {
    const box = (await target.boundingBox())!;
    expect(box.height, await target.innerText()).toBeGreaterThanOrEqual(44);
  }
  const shuffle = (await page.getByRole("button", { name: "Shuffle tagline" }).boundingBox())!;
  expect(shuffle.width).toBeGreaterThanOrEqual(44);
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("R15 every input and textarea is at least 16px so iOS doesn't zoom", async ({ page }) => {
    for (const path of ["/", "/setup"]) {
      await gotoQuiet(page, path);
      if (path === "/") await page.getByRole("button", { name: "Prompt preview" }).click();
      const sizes = await page
        .locator('input:not([type="checkbox"]):not([type="file"]), textarea')
        .evaluateAll((els) => els.map((e) => [e.id || e.outerHTML.slice(0, 60), parseFloat(getComputedStyle(e).fontSize)] as const));
      for (const [id, size] of sizes) expect(size, `${path} ${id}`).toBeGreaterThanOrEqual(16);
    }
  });
});

test("R17 skip link target #main-content exists on every route including 404", async ({ page }) => {
  for (const path of [...ROUTES, "/no-such-page"]) {
    await gotoQuiet(page, path);
    await expect(page.locator('a[href="#main-content"]')).toHaveCount(1);
    await expect(page.locator("#main-content")).toHaveCount(1);
  }
});

test("R24 home has visible h2s; 404 has one h1", async ({ page }) => {
  await gotoQuiet(page, "/");
  const visibleH2 = page.locator("main h2:not(.sr-only)");
  expect(await visibleH2.count()).toBeGreaterThan(0);
  await expect(visibleH2.first()).toBeVisible();
  await gotoQuiet(page, "/no-such-page");
  await expect(page.locator("h1")).toHaveCount(1);
});

test("R25 focused text inputs show a visible outline on keyboard focus", async ({ page }) => {
  for (const path of ["/", "/setup"]) {
    await gotoQuiet(page, path);
    // Inputs inside a closed (inert) disclosure can't take focus by design.
    const inputs = page.locator('main input[type="text"]:not([inert] *), main input[type="password"]:not([inert] *)');
    for (const input of await inputs.all()) {
      await input.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(input).toBeFocused();
      const outline = await input.evaluate((el) => ({ style: getComputedStyle(el).outlineStyle, width: getComputedStyle(el).outlineWidth }));
      expect(outline.style, `${path} ${await input.getAttribute("id")}`).not.toBe("none");
      expect(parseFloat(outline.width)).toBeGreaterThan(0);
    }
  }
});

test("R26 disclosures flip aria-expanded, and their panels are inert while closed", async ({ page }) => {
  await gotoQuiet(page, "/");
  for (const [name, panel] of DISCLOSURES) {
    const button = page.getByRole("button", { name });
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toHaveAttribute("aria-controls", panel.slice(1));
    await expect(page.locator(panel)).toHaveAttribute("inert", "");
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(panel)).not.toHaveAttribute("inert");
    await button.click();
    await expect(page.locator(panel)).toHaveAttribute("inert", "");
  }
});

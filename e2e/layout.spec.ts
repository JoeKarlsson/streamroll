import { test, expect, type Page } from "@playwright/test";
import { ROUTES, gotoQuiet, horizontalOverflow } from "./helpers";

const links = (page: Page, selector: string) =>
  page.locator(selector).locator("a").evaluateAll((els) =>
    els.map((a) => `${(a as HTMLAnchorElement).getAttribute("href")} ${a.textContent?.trim()}`),
  );

test("R23 every route renders the same site header and footer; wordmark links to /", async ({ page }) => {
  let header: string[] | undefined;
  let footer: string[] | undefined;
  for (const path of [...ROUTES, "/no-such-page"]) {
    await gotoQuiet(page, path);
    await expect(page.locator('nav[aria-label="Site"]')).toHaveCount(1);
    const h = await links(page, 'nav[aria-label="Site"]');
    const f = await links(page, "footer");
    expect(h.length).toBeGreaterThan(0);
    expect(f.length).toBeGreaterThan(0);
    header ??= h;
    footer ??= f;
    expect(h, `header on ${path}`).toEqual(header);
    expect(f, `footer on ${path}`).toEqual(footer);
    await expect(page.locator('nav[aria-label="Site"] a', { hasText: "StreamRoll" })).toHaveAttribute("href", "/");
  }
});

for (const width of [390, 320]) {
  test.describe(`R38 at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const path of ROUTES) {
      test(`${path} has no horizontal scroll and footer links stay on one line`, async ({ page }) => {
        await gotoQuiet(page, path);
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
        const wrapped = await page.locator("footer a").evaluateAll((els) =>
          els.filter((a) => a.getClientRects().length > 1).map((a) => a.textContent),
        );
        expect(wrapped).toEqual([]);
      });
    }
  });
}

test.describe("at 2560px", () => {
  test.use({ viewport: { width: 2560, height: 1440 } });

  for (const path of ROUTES) {
    test(`${path} renders without overflow`, async ({ page }) => {
      await gotoQuiet(page, path);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      const outside = await page.evaluate(() =>
        [...document.querySelectorAll("main *")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1) && !el.closest("[aria-hidden=true]");
          })
          .map((el) => el.outerHTML.slice(0, 80)),
      );
      expect(outside).toEqual([]);
    });
  }
});

test("R39 prose paragraphs are at most ~70ch wide on /about and /how-it-works", async ({ page }) => {
  for (const path of ["/about", "/how-it-works"]) {
    await gotoQuiet(page, path);
    const tooWide = await page.locator("main p").evaluateAll((ps) =>
      ps
        .filter((p) => {
          const probe = document.createElement("span");
          probe.textContent = "0".repeat(70);
          probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font:inherit";
          p.appendChild(probe);
          const ch70 = probe.getBoundingClientRect().width;
          probe.remove();
          return p.getBoundingClientRect().width > ch70 + 1;
        })
        .map((p) => p.textContent?.slice(0, 60)),
    );
    expect(tooWide, path).toEqual([]);
  }
});

test("R40 no visible text below 12px on home", async ({ page }) => {
  await gotoQuiet(page, "/");
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .filter((el) => {
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
        if (!hasText || !(el as HTMLElement).checkVisibility?.()) return false;
        if (el.closest(".sr-only")) return false;
        return parseFloat(getComputedStyle(el).fontSize) < 12;
      })
      .map((el) => `${getComputedStyle(el).fontSize} ${el.textContent?.trim().slice(0, 40)}`),
  );
  expect(small).toEqual([]);
});

test("R53 footer links are underlined", async ({ page }) => {
  await gotoQuiet(page, "/");
  const notUnderlined = await page.locator("footer a").evaluateAll((els) =>
    els.filter((a) => !getComputedStyle(a).textDecorationLine.includes("underline")).map((a) => a.textContent),
  );
  expect(notUnderlined).toEqual([]);
});

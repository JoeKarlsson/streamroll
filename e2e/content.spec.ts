import { test, expect, type Page } from "@playwright/test";
import { ROUTES, gotoQuiet } from "./helpers";

test("R01 key copy is true on every page", async ({ page }) => {
  for (const path of ROUTES) {
    await gotoQuiet(page, path);
    const html = await page.content();
    for (const claim of ["Never sent to our servers", "sent directly to Runway", "Runs entirely in your browser"]) {
      expect(html, `${path}: ${claim}`).not.toContain(claim);
    }
    if (path === "/" || path === "/setup") {
      await expect(page.locator("main").getByText(/passes it through this site.s server/).first()).toBeVisible();
    }
  }
});

test("R22 no 'free' next to Runway credit/account CTAs; gen4_image cost is ~30 everywhere", async ({ page }) => {
  for (const path of ROUTES) {
    await gotoQuiet(page, path);
    const text = await page.locator("body").innerText();
    expect(text, path).not.toMatch(/Get one free|Free Runway account|free API key/i);
  }
  // gen4_image's title-card cost, wherever a page states it
  for (const [path, pattern] of [
    ["/setup", /Gen4 Image\D+~?(\d+)\s*cr/],
    ["/how-it-works", /gen4_image[^.]*\.\s*Cost: about (\d+) credits/i],
  ] as const) {
    await gotoQuiet(page, path);
    const match = (await page.locator("main").innerText()).match(pattern);
    expect(match?.[1], path).toBe("30");
  }
  await gotoQuiet(page, "/");
  await page.getByRole("button", { name: "Advanced settings" }).click();
  await expect(page.getByRole("group", { name: "Image model" }).getByRole("button", { name: /Gen4 Image/ }).first()).toContainText("30");
});

for (const path of ROUTES) {
  test(`R48 R52 R58 visible text on ${path}: no emoji, no "→" link endings, no "..." or 1920x1080`, async ({ page }) => {
    await gotoQuiet(page, path);
    // Code samples may legitimately contain spreads and dimensions; check prose only.
    const text = await page.evaluate(() => {
      const clone = document.body.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("pre, code, script, style").forEach((n) => n.remove());
      document.body.appendChild(clone);
      const t = clone.innerText;
      clone.remove();
      return t;
    });
    if (path === "/") expect(text.match(/\p{Extended_Pictographic}/gu) ?? []).toEqual([]);
    const arrowLinks = await page.locator("a:visible").evaluateAll((as) =>
      as.map((a) => (a as HTMLElement).innerText.trim()).filter((t) => t.endsWith("→")),
    );
    expect(arrowLinks).toEqual([]);
    expect(text).not.toContain("...");
    expect(text).not.toMatch(/\d+x\d+/);
  });
}

test("R49 no uppercase text-transform in main content on home and /how-it-works", async ({ page }) => {
  for (const path of ["/", "/how-it-works"]) {
    await gotoQuiet(page, path);
    const upper = await page.locator("main *").evaluateAll((els) =>
      els.filter((e) => getComputedStyle(e).textTransform === "uppercase").map((e) => e.textContent?.slice(0, 40)),
    );
    expect(upper, path).toEqual([]);
  }
});

test("R14 body font is Geist, no Cinzel requested, at most one font preload", async ({ page }) => {
  const fonts: string[] = [];
  page.on("request", (r) => { if (r.resourceType() === "font" || /fonts\.googleapis/.test(r.url())) fonts.push(r.url()); });
  for (const path of ROUTES) {
    await gotoQuiet(page, path);
    expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/Geist/);
    expect(await page.locator('link[rel="preload"][as="font"]').count()).toBeLessThanOrEqual(1);
  }
  expect(fonts.filter((u) => /cinzel/i.test(u))).toEqual([]);
});

async function homeResources(page: Page) {
  await gotoQuiet(page, "/");
  await page.waitForLoadState("networkidle");
  return page.evaluate(() =>
    [...performance.getEntriesByType("navigation"), ...performance.getEntriesByType("resource")].map((e) => ({
      url: e.name,
      bytes: (e as PerformanceResourceTiming).transferSize,
      body: (e as PerformanceResourceTiming).encodedBodySize,
    })),
  );
}

test("R02 home transfers under 2 MB on load", async ({ page }) => {
  const entries = await homeResources(page);
  expect(entries.reduce((sum, e) => sum + e.bytes, 0)).toBeLessThan(2 * 1024 * 1024);
});

test("R02 no tile image loaded on home is over 100 KB", async ({ page }) => {
  const tiles = (await homeResources(page)).filter((e) => /\/(previews|studios)\//.test(e.url));
  expect(tiles.length).toBeGreaterThan(0);
  expect(tiles.filter((e) => e.body > 100 * 1024)).toEqual([]);
});

test("R02 home has at most 6 image preloads", async ({ page }) => {
  await gotoQuiet(page, "/");
  expect(await page.locator('link[rel="preload"][as="image"]').count()).toBeLessThanOrEqual(6);
});

test("R03 hero video has a poster, preloads metadata, and the poster is preloaded with high priority", async ({ page }) => {
  await gotoQuiet(page, "/");
  const first = page.locator("main video").first();
  const poster = await first.getAttribute("poster");
  expect(poster).toBeTruthy();
  await expect(first).toHaveAttribute("preload", "metadata");
  await expect(page.locator(`link[rel="preload"][as="image"][href="${poster}"]`)).toHaveAttribute("fetchpriority", "high");
});

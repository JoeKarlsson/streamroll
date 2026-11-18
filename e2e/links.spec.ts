import { test, expect, type Page } from "@playwright/test";
import { ROUTES, gotoQuiet } from "./helpers";

// External links hit other people's servers, so they only run under `npm run test:links`.
const checkExternal = !!process.env.CHECK_EXTERNAL_LINKS;

async function linksOn(page: Page) {
  const hrefs = await page.locator("a[href]").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
  return [...new Set(hrefs.map((h) => h.replace(/#.*$/, "")).filter((h) => /^https?:/.test(h)))];
}

test("internal links on every route return 200", async ({ page, request, baseURL }) => {
  const internal = new Set<string>();
  for (const path of ROUTES) {
    await gotoQuiet(page, path);
    for (const href of await linksOn(page)) if (href.startsWith(baseURL!)) internal.add(href);
  }
  expect(internal.size).toBeGreaterThan(0);
  for (const href of internal) expect((await request.get(href)).status(), href).toBe(200);
});

test("external links on every route respond", async ({ page, request, baseURL }) => {
  test.skip(!checkExternal, "opt-in: npm run test:links");
  const external = new Set<string>();
  for (const path of ROUTES) {
    await gotoQuiet(page, path);
    for (const href of await linksOn(page)) if (!href.startsWith(baseURL!)) external.add(href);
  }
  const broken: string[] = [];
  for (const href of external) {
    const res = await request.get(href, { maxRedirects: 10, failOnStatusCode: false }).catch((e: Error) => e);
    // 403/429 are bot walls (Reddit, Cloudflare), not dead links.
    if (res instanceof Error) broken.push(`${href} ${res.message}`);
    else if (res.status() >= 400 && ![403, 429].includes(res.status())) broken.push(`${href} ${res.status()}`);
  }
  expect(broken).toEqual([]);
});

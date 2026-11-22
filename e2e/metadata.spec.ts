import { test, expect, type Page } from "@playwright/test";
import { ROUTES, INDEXABLE_ROUTES, SITE, gotoQuiet } from "./helpers";

const meta = (page: Page, attr: "name" | "property", key: string) =>
  page.locator(`meta[${attr}="${key}"]`).getAttribute("content");

for (const path of ROUTES) {
  test(`metadata ${path}`, async ({ page, request }) => {
    await gotoQuiet(page, path);

    const title = await page.title();
    expect(title.trim()).not.toBe("");

    const description = await meta(page, "name", "description");
    expect(description?.length ?? 0).toBeGreaterThan(0);
    expect(description!.length).toBeLessThanOrEqual(160);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toMatch(/^https:\/\//);
    expect(new URL(canonical!).pathname.replace(/\/$/, "")).toBe(path.replace(/\/$/, ""));

    // R16 og:image === twitter:image, image returns 200 and is 1200x630
    const og = await meta(page, "property", "og:image");
    const tw = await meta(page, "name", "twitter:image");
    expect(og).toBeTruthy();
    expect(tw).toBe(og);
    const imagePath = new URL(og!).pathname;
    expect((await request.get(imagePath)).status()).toBe(200);
    const size = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      return [img.naturalWidth, img.naturalHeight];
    }, imagePath);
    expect(size).toEqual([1200, 630]);

    // R20 meta color-scheme "only dark" + darkreader-lock
    expect(await meta(page, "name", "color-scheme")).toBe("only dark");
    expect(await page.locator('meta[name="darkreader-lock"]').count()).toBe(1);

    // R19 og:site_name and og:locale on every route
    expect(await meta(page, "property", "og:site_name")).toBe("StreamRoll");
    expect(await meta(page, "property", "og:locale")).toBeTruthy();
    // ...and each page's twitter:title is its own (the /about bug carried the home title)
    expect(await meta(page, "name", "twitter:title")).toBe(await meta(page, "property", "og:title"));
    if (path !== "/") expect(await meta(page, "name", "twitter:title")).not.toMatch(/AI Streaming Intros/);

    // R73 theme-color and author
    expect(await meta(page, "name", "theme-color")).toBe("#080808");
    expect(await meta(page, "name", "author")).toBeTruthy();

    await expect(page.locator("h1")).toHaveCount(1);

    const robots = await page.locator('meta[name="robots"]').evaluateAll((ms) => ms.map((m) => m.getAttribute("content")).join(","));
    if (path === "/setup") expect(robots).toMatch(/noindex/);
    else expect(robots).not.toMatch(/noindex/);
  });
}

test("titles are unique across routes", async ({ page }) => {
  const seen: string[] = [];
  for (const path of ROUTES) {
    await gotoQuiet(page, path);
    seen.push(await page.title());
  }
  expect(new Set(seen).size).toBe(seen.length);
});

test("R73 home description is at most 155 characters", async ({ page }) => {
  await gotoQuiet(page, "/");
  expect((await meta(page, "name", "description"))!.length).toBeLessThanOrEqual(155);
});

test("R20 body background stays #080808 under a light colour-scheme preference", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  for (const path of ROUTES) {
    await gotoQuiet(page, path);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(8, 8, 8)");
  }
});

test("sitemap lists exactly the indexable routes; R70 with lastmod and no changefreq/priority", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
  expect(locs.sort()).toEqual([...INDEXABLE_ROUTES].sort());
  expect(xml).not.toContain("/setup");
  expect(xml.match(/<lastmod>/g)?.length).toBe(INDEXABLE_ROUTES.length);
  expect(xml).not.toMatch(/<changefreq>|<priority>/);
});

test("R18 FAQPage JSON-LD only on /how-it-works, WebApplication only on /, no built-in Jellyfin pre-roll claim", async ({ page }) => {
  for (const path of ROUTES) {
    await gotoQuiet(page, path);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = blocks.map((b) => JSON.parse(b)["@type"]);
    expect(types.includes("FAQPage"), `FAQPage on ${path}`).toBe(path === "/how-it-works");
    expect(types.includes("WebApplication"), `WebApplication on ${path}`).toBe(path === "/");
    // Jellyfin has no built-in pre-roll setting; the old answer pointed at "Administration → Pre-Roll Video".
    const jellyfin = blocks
      .flatMap((b) => JSON.parse(b).mainEntity ?? [])
      .filter((q: { name: string }) => /Jellyfin/.test(q.name))
      .map((q: { acceptedAnswer: { text: string } }) => q.acceptedAnswer.text);
    for (const answer of jellyfin) expect(answer).not.toMatch(/Pre-Roll Video|Administration\s*→\s*Pre-Roll/i);
  }
});

test("R72 llms.txt lists /about", async ({ request }) => {
  expect(await (await request.get("/llms.txt")).text()).toContain(`${SITE}/about`);
});

test("R74 icons return 200 and the manifest has maskable icons and no orientation lock", async ({ page, request }) => {
  await gotoQuiet(page, "/");
  for (const rel of ["icon", "apple-touch-icon"]) {
    const hrefs = await page.locator(`link[rel="${rel}"]`).evaluateAll((els) => els.map((e) => (e as HTMLLinkElement).href));
    expect(hrefs.length, rel).toBeGreaterThan(0);
    for (const href of hrefs) expect((await request.get(href)).status(), href).toBe(200);
  }
  expect((await request.get("/icon.svg")).status()).toBe(200);
  const manifest = await (await request.get("/manifest.json")).json();
  expect(manifest.orientation).toBeUndefined();
  const maskable = manifest.icons.filter((i: { purpose?: string }) => i.purpose?.includes("maskable"));
  expect(maskable.length).toBeGreaterThan(0);
  for (const icon of manifest.icons) expect((await request.get(icon.src)).status(), icon.src).toBe(200);
});

test("R75 security.txt has Contact and an Expires date in the future", async ({ request }) => {
  const res = await request.get("/.well-known/security.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toMatch(/^Contact: \S+/m);
  const expires = body.match(/^Expires: (.+)$/m)?.[1];
  expect(new Date(expires!).getTime()).toBeGreaterThan(Date.now());
});

test("R43 preview, studio and example assets are served immutable", async ({ request }) => {
  for (const path of ["/previews/style-cinematic.jpg", "/studios/thumbs/columbia.webp", "/examples/hero-poster.webp"]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()["cache-control"], path).toMatch(/immutable/);
  }
});

test("R46 CSP: no bare https: in connect-src, no Plausible host in script-src, Plausible loads from /js/", async ({ page, request }) => {
  const csp = (await request.get("/")).headers()["content-security-policy"];
  if (!csp) throw new Error("no Content-Security-Policy header on /");
  const directive = (name: string) => csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(name + " ")) ?? "";
  expect(directive("connect-src").split(/\s+/)).not.toContain("https:");
  expect(directive("script-src")).not.toMatch(/plausible/);
  await gotoQuiet(page, "/");
  await expect(page.locator('script[src^="/js/"]')).toHaveCount(1);
  await expect(page.locator('script[src*="plausible"]')).toHaveCount(0);
});

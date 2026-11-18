import { test, expect } from "@playwright/test";
import { ROUTES, gotoQuiet, watchForProblems } from "./helpers";

for (const path of ROUTES) {
  test(`smoke ${path}: 200, no console errors, failed requests or CSP violations`, async ({ page }) => {
    const problems = await watchForProblems(page);
    const res = await gotoQuiet(page, path);
    expect(res.status()).toBe(200);
    await page.waitForLoadState("networkidle");
    expect(problems).toEqual([]);
  });
}

test("404: random path is a 404 with an h1, noindex and links to the main pages", async ({ page }) => {
  const res = await gotoQuiet(page, `/no-such-page-${Date.now()}`);
  expect(res.status()).toBe(404);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  // R44 404 has links to /how-it-works, /about, /setup
  const main = page.locator("main");
  for (const href of ["/", "/how-it-works", "/about", "/setup"]) {
    await expect(main.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
});

test("markdown negotiation: /how-it-works serves Markdown to Accept: text/markdown and HTML otherwise", async ({ request }) => {
  // R71 Accept: text/markdown on /how-it-works → text/markdown with Vary: Accept
  const md = await request.get("/how-it-works", { headers: { Accept: "text/markdown" } });
  expect(md.status()).toBe(200);
  expect(md.headers()["content-type"]).toMatch(/^text\/markdown/);
  expect(md.headers()["vary"]).toMatch(/\bAccept\b/);
  expect(await md.text()).toMatch(/^# /m);

  const html = await request.get("/how-it-works");
  expect(html.headers()["content-type"]).toMatch(/^text\/html/);
  expect(html.headers()["vary"]).toMatch(/\bAccept\b/);
});

test("R21 /api/video (bare route) returns 404", async ({ request }) => {
  expect((await request.post("/api/video", { data: {} })).status()).toBe(404);
  expect((await request.get("/api/video")).status()).toBe(404);
});

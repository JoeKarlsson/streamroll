import { expect, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

export const ROUTES = ["/", "/about", "/how-it-works", "/setup"] as const;
export const INDEXABLE_ROUTES = ["/", "/about", "/how-it-works"] as const;
export const SITE = "https://streamroll.vercel.app";

// Plausible is proxied through /js/* and /api/event; tests must never send it pageviews.
const ANALYTICS = /\/(js\/[^/]+\.js|api\/event)(\?|$)/;
export const isAnalytics = (url: string) => ANALYTICS.test(new URL(url).pathname);

export async function blockAnalytics(page: Page) {
  await page.route((url) => isAnalytics(url.href), (route) => route.abort());
}

// Nothing may reach Runway: every /api route except the blocked analytics one is answered here or fails the test.
export async function blockApi(page: Page, posted: string[] = []) {
  await page.route(/\/api\/(image|upload|video)(\/|\?|$)/, (route) => {
    posted.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
    return route.fulfill({ status: 500, json: { error: "blocked in e2e" } });
  });
  return posted;
}

/** Records console errors, page errors, failed requests, HTTP errors and CSP violations (analytics excluded). */
export async function watchForProblems(page: Page) {
  const problems: string[] = [];
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => {
      console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const url = msg.location().url;
    if (url && isAnalytics(url)) return;
    problems.push(`console: ${msg.text()} (${url})`);
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  page.on("requestfailed", (req) => {
    if (isAnalytics(req.url())) return;
    // Chromium cancels a video's range request once the hero montage pauses or swaps that clip: expected, not a failure.
    if (req.resourceType() === "media" && req.failure()?.errorText === "net::ERR_ABORTED") return;
    problems.push(`requestfailed: ${req.url()} ${req.failure()?.errorText}`);
  });
  page.on("response", (res) => {
    if (res.status() >= 400 && !isAnalytics(res.url())) problems.push(`HTTP ${res.status()}: ${res.url()}`);
  });
  return problems;
}

export async function gotoQuiet(page: Page, path: string) {
  await blockAnalytics(page);
  const res = await page.goto(path, { waitUntil: "load" });
  expect(res, `no response for ${path}`).not.toBeNull();
  return res!;
}

export async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(" ")).join("\n  ")}`,
  );
  expect(summary).toEqual([]);
}

export async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

/** Tabs through the page from the top; returns how many of its file inputs took focus. */
export async function fileInputsReachedByTab(page: Page) {
  const total = await page.locator('input[type="file"]').count();
  const reached = new Set<number>();
  for (let i = 0; i < 200 && reached.size < total; i++) {
    await page.keyboard.press("Tab");
    const index = await page.evaluate(() =>
      [...document.querySelectorAll('input[type="file"]')].indexOf(document.activeElement as Element),
    );
    if (index >= 0) reached.add(index);
  }
  return { reached: reached.size, total };
}

// Same key and shape app/page.tsx persists; fixture media come from public/examples.
const GEN_STATE_KEY = "streamroll_gen_state";
export const doneState = {
  step: "done",
  imageUrl: "/examples/hero-poster.webp",
  videoUrl: "/examples/clip-1.mp4",
  timings: { image: 4200, video: 31000 },
  error: null,
  name: "Joeflix",
  style: "cinematic",
  tagline: "Where stories come alive",
  videoModel: "gen4.5",
  imageModel: "gen4_image",
  treatment: "full-bleed",
  duration: 5,
};

export async function seed(page: Page, state: object) {
  await page.addInitScript(
    ([key, value]) => sessionStorage.setItem(key, value),
    [GEN_STATE_KEY, JSON.stringify(state)] as const,
  );
}

/** The first button in a toggle group that is not pressed, pinned by index so clicking it doesn't re-resolve. */
export async function firstUnpressed(group: Locator) {
  const index = await group.locator("button").evaluateAll((bs) => bs.findIndex((b) => b.getAttribute("aria-pressed") === "false"));
  expect(index).toBeGreaterThanOrEqual(0);
  return group.locator("button").nth(index);
}

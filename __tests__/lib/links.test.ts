import { describe, it, expect } from "vitest";
import { LINKS, BUILDER, tweetShareUrl, redditShareUrl } from "@/lib/links";

describe("LINKS constants", () => {
  it("all link values are non-empty strings", () => {
    for (const [key, value] of Object.entries(LINKS)) {
      expect(typeof value, `LINKS.${key}`).toBe("string");
      expect(value.length, `LINKS.${key}`).toBeGreaterThan(0);
    }
  });

  it("UTM params are present on Runway links", () => {
    const runwayLinks = [LINKS.runwaySignup, LINKS.runwayApiKeys, LINKS.runwayDocs, LINKS.runwayPricing, LINKS.runwaySDK];
    for (const link of runwayLinks) {
      expect(link).toContain("utm_source=streamroll");
    }
  });

  it("repoGitHub points to the correct repo", () => {
    expect(LINKS.repoGitHub).toContain("JoeKarlsson/streamroll");
  });
});

describe("BUILDER constants", () => {
  it("all builder values are non-empty strings", () => {
    for (const [key, value] of Object.entries(BUILDER)) {
      expect(typeof value, `BUILDER.${key}`).toBe("string");
      expect(value.length, `BUILDER.${key}`).toBeGreaterThan(0);
    }
  });
});

describe("tweetShareUrl", () => {
  it("includes the service name in the tweet text", () => {
    const url = tweetShareUrl("Plex");
    expect(decodeURIComponent(url)).toContain("Plex");
  });

  it("returns a Twitter intent URL", () => {
    const url = tweetShareUrl("Jellyfin");
    expect(url).toContain("twitter.com/intent/tweet");
  });

  it("includes default app URL when not provided", () => {
    const url = tweetShareUrl("Emby");
    expect(decodeURIComponent(url)).toContain("streamroll.vercel.app");
  });

  it("uses a custom app URL when provided", () => {
    const url = tweetShareUrl("Plex", "https://my-custom-app.com");
    expect(decodeURIComponent(url)).toContain("my-custom-app.com");
  });

  it("includes RunwayML and AI hashtags", () => {
    const url = tweetShareUrl("Plex");
    expect(url).toContain("RunwayML");
    expect(url).toContain("AI");
  });

  it("URL-encodes the service name correctly", () => {
    const url = tweetShareUrl("My Custom Service");
    // Should not contain raw spaces
    expect(url).not.toContain(" ");
  });
});

describe("redditShareUrl", () => {
  it("includes the service name in the post title", () => {
    const url = redditShareUrl("Plex");
    expect(decodeURIComponent(url)).toContain("Plex");
  });

  it("targets the plexprerolls subreddit", () => {
    const url = redditShareUrl("Jellyfin");
    expect(url).toContain("reddit.com/r/plexprerolls/submit");
  });

  it("sets type=self for a text post", () => {
    const url = redditShareUrl("Emby");
    expect(url).toContain("type=self");
  });

  it("URL-encodes the title", () => {
    const url = redditShareUrl("My Service");
    expect(url).not.toContain(" ");
  });
});

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

function request(accept: string) {
  return new NextRequest("http://localhost/how-it-works", { headers: { accept } });
}

describe("proxy for /how-it-works", () => {
  it("rewrites Markdown requests to the hand-written Markdown file", () => {
    const res = proxy(request("text/markdown, text/html;q=0.9"));
    expect(res.headers.get("x-middleware-rewrite")).toBe("http://localhost/how-it-works.md");
    expect(res.headers.get("vary")).toBe("Accept");
  });

  it("lets browsers through to the HTML page, still varying on Accept", () => {
    const res = proxy(request("text/html,application/xhtml+xml"));
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("vary")).toBe("Accept");
  });
});

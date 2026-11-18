import { NextResponse, type NextRequest } from "next/server";

// Agents that ask for Markdown get the hand-written public/how-it-works.md instead of the HTML page.
export function proxy(request: NextRequest) {
  const wantsMarkdown = request.headers.get("accept")?.includes("text/markdown") ?? false;
  const response = wantsMarkdown
    ? NextResponse.rewrite(new URL("/how-it-works.md", request.url), {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      })
    : NextResponse.next();
  response.headers.set("Vary", "Accept");
  return response;
}

export const config = {
  matcher: "/how-it-works",
};

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CodeBlock } from "@/app/how-it-works/CodeBlock";

describe("CodeBlock", () => {
  afterEach(() => vi.restoreAllMocks());

  it("announces Copy failed when the clipboard rejects", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    render(<CodeBlock code="npm install @runwayml/sdk" lang="bash" />);

    await user.click(screen.getByRole("button", { name: "Copy bash code" }));

    expect((await screen.findByRole("status")).textContent).toContain("Copy failed");
  });

  it("announces Copied when the clipboard accepts", async () => {
    const user = userEvent.setup();
    render(<CodeBlock code="npm install @runwayml/sdk" lang="bash" />);

    await user.click(screen.getByRole("button", { name: "Copy bash code" }));

    expect((await screen.findByRole("status")).textContent).toContain("Copied to clipboard");
    expect(await navigator.clipboard.readText()).toBe("npm install @runwayml/sdk");
  });
});

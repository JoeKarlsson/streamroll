import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SetupPage from "@/app/setup/page";

describe("SetupPage key form", () => {
  beforeEach(() => localStorage.clear());

  it("saves the key on Enter, announces it and moves focus to the saved key", async () => {
    const user = userEvent.setup();
    render(<SetupPage />);

    await user.type(await screen.findByLabelText("Runway API key"), "key_abc123{Enter}");

    expect(localStorage.getItem("runway_api_key")).toBe("key_abc123");
    expect((screen.getByRole("status")).textContent).toContain("Key saved");
    expect(document.activeElement).toBe(screen.getByText("✓ API key saved").parentElement);
  });

  it("moves focus back to the input after Remove", async () => {
    localStorage.setItem("runway_api_key", "key_abc123");
    const user = userEvent.setup();
    render(<SetupPage />);

    await user.click(await screen.findByRole("button", { name: "Remove" }));

    expect(localStorage.getItem("runway_api_key")).toBeNull();
    expect(document.activeElement).toBe(screen.getByLabelText("Runway API key"));
  });
});

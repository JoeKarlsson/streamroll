import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NoCreditsNotice } from "@/app/_components/NoCreditsNotice";

const fetchMock = vi.fn();

describe("NoCreditsNotice", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("warns before Generate when the saved key has 0 credits", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ creditBalance: 0 })));
    render(<NoCreditsNotice apiKey="key_empty" />);
    expect((await screen.findByRole("alert")).textContent).toMatch(/no credits/i);
    expect(fetchMock).toHaveBeenCalledWith("/api/credits", expect.objectContaining({ headers: { "x-runway-key": "key_empty" } }));
  });

  it("stays hidden when the key has credits or the lookup fails", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ creditBalance: 250 })));
    const { unmount } = render(<NoCreditsNotice apiKey="key_paid" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).toBeNull();
    unmount();

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "down" }), { status: 502 }));
    render(<NoCreditsNotice apiKey="key_other" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

import { describe, expect, it, vi } from "vitest";

import { requestAppFullscreen } from "@/lib/browser/fullscreen";

describe("requestAppFullscreen", () => {
  it("returns false when requestFullscreen is missing", async () => {
    const element = document.createElement("div");
    expect(await requestAppFullscreen(element)).toBe(false);
  });

  it("returns true when fullscreen succeeds", async () => {
    const element = document.createElement("div");
    element.requestFullscreen = vi.fn().mockResolvedValue(undefined);

    expect(await requestAppFullscreen(element)).toBe(true);
  });
});

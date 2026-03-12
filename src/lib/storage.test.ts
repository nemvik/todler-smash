import { beforeEach, describe, expect, it } from "vitest";

import { loadStoredSettings } from "@/lib/storage";
import abcTheme from "@/content/themes/abc.json";
import { createDefaultSettings } from "@/lib/theme/themeUtils";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("falls back to provided settings when local storage is empty", () => {
    const fallback = createDefaultSettings(abcTheme, "cs");
    const settings = loadStoredSettings(fallback);

    expect(settings).toEqual(fallback);
    expect(settings.burstCount).toBe(2);
    expect(settings.animatedBackground).toBe(true);
  });

  it("merges stored settings with the fallback shape", () => {
    const fallback = createDefaultSettings(abcTheme, "cs");
    localStorage.setItem(
      "bublbac.v1.settings",
      JSON.stringify({ volume: 0.2, themeId: "space" }),
    );

    const settings = loadStoredSettings(fallback);
    expect(settings.volume).toBe(0.2);
    expect(settings.themeId).toBe("space");
    expect(settings.soundEnabled).toBe(true);
  });
});

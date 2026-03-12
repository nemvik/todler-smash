import { describe, expect, it } from "vitest";

import abcTheme from "@/content/themes/abc.json";
import emojiPartyTheme from "@/content/themes/emoji-party.json";
import { createDefaultSettings, mergeThemes } from "@/lib/theme/themeUtils";

describe("themeUtils", () => {
  it("merges built-in theme overrides without mutating other themes", () => {
    const merged = mergeThemes(
      [abcTheme, emojiPartyTheme],
      {
        abc: {
          description: {
            cs: "Nový popis",
            en: "New description",
          },
        },
      },
      [],
    );

    expect(merged.find((theme) => theme.id === "abc")?.description.cs).toBe(
      "Nový popis",
    );
    expect(
      merged.find((theme) => theme.id === "emoji-party")?.description.cs,
    ).toBe(emojiPartyTheme.description.cs);
  });

  it("creates a default settings object seeded from theme defaults", () => {
    const settings = createDefaultSettings(abcTheme, "cs");

    expect(settings.themeId).toBe("abc");
    expect(settings.volume).toBe(abcTheme.defaults.volume);
    expect(settings.fadeMs).toBe(abcTheme.defaults.fadeMs);
    expect(settings.burstCount).toBe(2);
    expect(settings.language).toBe("cs");
  });
});

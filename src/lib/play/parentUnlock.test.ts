import { describe, expect, it } from "vitest";

import { PARENT_SEQUENCE, pushParentSequence } from "@/lib/play/parentUnlock";

describe("pushParentSequence", () => {
  it("matches the parent sequence when typed in order", () => {
    let buffer = "";
    let matched = false;

    for (const char of PARENT_SEQUENCE) {
      const next = pushParentSequence(buffer, char);
      buffer = next.nextBuffer;
      matched = next.matched;
    }

    expect(buffer).toBe(PARENT_SEQUENCE);
    expect(matched).toBe(true);
  });

  it("ignores non-character keys", () => {
    const next = pushParentSequence("pare", "Enter");
    expect(next.nextBuffer).toBe("pare");
    expect(next.matched).toBe(false);
  });
});

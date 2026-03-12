import { expect, test } from "@playwright/test";

test("main play flow unlocks fullscreen/audio and reacts to input", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as typeof window & {
      __fullscreenRequests?: number;
      __resumeCalls?: number;
      __fakeFullscreenEl?: Element | null;
    }).__fullscreenRequests = 0;

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get() {
        return (window as typeof window & { __fakeFullscreenEl?: Element | null })
          .__fakeFullscreenEl ?? null;
      },
    });

    HTMLElement.prototype.requestFullscreen = async function () {
      const state = window as typeof window & {
        __fullscreenRequests?: number;
        __fakeFullscreenEl?: Element | null;
      };
      state.__fullscreenRequests = (state.__fullscreenRequests ?? 0) + 1;
      state.__fakeFullscreenEl = this;
      document.dispatchEvent(new Event("fullscreenchange"));
    };

    if ("AudioContext" in window) {
      const originalResume = AudioContext.prototype.resume;
      AudioContext.prototype.resume = function (...args: []) {
        const state = window as typeof window & { __resumeCalls?: number };
        state.__resumeCalls = (state.__resumeCalls ?? 0) + 1;
        return originalResume.apply(this, args);
      };
    }
  });

  await page.goto("/");
  await page.getByRole("button", { name: /Vesmír/i }).click();
  await page.getByRole("button", { name: "Spustit hraní" }).click();

  await expect(page).toHaveURL(/\/play$/);
  await expect(page.getByTestId("background-motion")).toHaveAttribute(
    "data-motion-style",
    "stars",
  );

  const fullscreenAttempts = await page.evaluate(
    () => (window as typeof window & { __fullscreenRequests?: number }).__fullscreenRequests,
  );
  expect(fullscreenAttempts).toBeGreaterThan(0);

  const audioResumes = await page.evaluate(
    () => (window as typeof window & { __resumeCalls?: number }).__resumeCalls ?? 0,
  );
  expect(audioResumes).toBeGreaterThanOrEqual(0);

  await page.keyboard.press("A");
  await page.mouse.move(220, 180);
  await page.mouse.click(420, 320);

  const initialSnapshot = await page.evaluate(() => {
    return JSON.parse(window.render_game_to_text?.() ?? "{}");
  });

  expect(initialSnapshot.activeReactions).toBeGreaterThan(0);
  expect(initialSnapshot.totalInteractions).toBeGreaterThan(0);

  await page.keyboard.type("parent");
  await expect(page.getByText("Rodičovské ovládání")).toBeVisible();

  await page.getByRole("switch", { name: "Omezený pohyb" }).click();
  await page.getByRole("button", { name: "Zavřít" }).click();
  await expect(page.getByTestId("background-motion")).toHaveCount(0);

  await page.mouse.click(320, 240);
  const reducedSnapshot = await page.evaluate(() =>
    JSON.parse(window.render_game_to_text?.() ?? "{}"),
  );
  expect(reducedSnapshot.reducedMotion).toBe(true);

  await page.evaluate(() => window.advanceTime?.(2500));
  const fadedSnapshot = await page.evaluate(() =>
    JSON.parse(window.render_game_to_text?.() ?? "{}"),
  );

  expect(fadedSnapshot.activeReactions).toBeLessThanOrEqual(
    reducedSnapshot.activeReactions,
  );
});

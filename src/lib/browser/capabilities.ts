import type { BrowserCapabilities } from "@/types/app";

export function getBrowserCapabilities(): BrowserCapabilities {
  if (typeof window === "undefined") {
    return {
      fullscreen: false,
      fullscreenOptions: false,
      keyboardLock: false,
      wakeLock: false,
      touch: false,
    };
  }

  const fullscreenTarget = document.documentElement as Element;

  return {
    fullscreen:
      typeof fullscreenTarget.requestFullscreen === "function" ||
      "webkitRequestFullscreen" in fullscreenTarget,
    fullscreenOptions: typeof fullscreenTarget.requestFullscreen === "function",
    keyboardLock: typeof navigator.keyboard?.lock === "function",
    wakeLock: typeof navigator.wakeLock?.request === "function",
    touch:
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches,
  };
}

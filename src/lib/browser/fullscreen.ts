export async function requestAppFullscreen(element: HTMLElement) {
  if (!element.requestFullscreen) {
    return false;
  }

  try {
    await element.requestFullscreen({ navigationUI: "hide" });
    return true;
  } catch {
    try {
      await element.requestFullscreen();
      return true;
    } catch {
      return false;
    }
  }
}

export async function exitAppFullscreen() {
  if (!document.fullscreenElement || !document.exitFullscreen) {
    return;
  }

  try {
    await document.exitFullscreen();
  } catch {
    // Ignore browser-specific fullscreen exit failures.
  }
}

export async function requestKeyboardLock() {
  if (!navigator.keyboard?.lock) {
    return false;
  }

  try {
    await navigator.keyboard.lock();
    return true;
  } catch {
    return false;
  }
}

export function releaseKeyboardLock() {
  navigator.keyboard?.unlock?.();
}

export async function requestWakeLock() {
  if (!navigator.wakeLock?.request) {
    return null;
  }

  try {
    return await navigator.wakeLock.request("screen");
  } catch {
    return null;
  }
}

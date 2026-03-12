declare global {
  interface FullscreenOptions {
    navigationUI?: "auto" | "show" | "hide";
  }

  interface Element {
    requestFullscreen?(options?: FullscreenOptions): Promise<void>;
  }

  interface Keyboard {
    lock?(keyCodes?: string[]): Promise<void>;
    unlock?(): void;
  }

  interface Navigator {
    keyboard?: Keyboard;
    wakeLock?: {
      request(type: "screen"): Promise<WakeLockSentinel>;
    };
  }

  interface WakeLockSentinel extends EventTarget {
    readonly released: boolean;
    release(): Promise<void>;
    onrelease: ((this: WakeLockSentinel, ev: Event) => unknown) | null;
  }

  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}

export {};

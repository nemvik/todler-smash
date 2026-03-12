import { useEffect, useRef } from "react";

import { PlayEngine } from "@/lib/play/PlayEngine";
import { pushParentSequence } from "@/lib/play/parentUnlock";
import type { AudioSynth } from "@/lib/audio/synth";
import type { ParentSettings, ThemePack } from "@/types/app";
import styles from "@/styles/PlayPage.module.css";

interface PlaySurfaceProps {
  theme: ThemePack;
  settings: ParentSettings;
  audioSynth: AudioSynth;
  onParentSequence: () => void;
}

export function PlaySurface({
  theme,
  settings,
  audioSynth,
  onParentSequence,
}: PlaySurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);
  const parentBufferRef = useRef("");

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const focusTarget = focusRef.current;

    if (!container || !canvas || !focusTarget) {
      return;
    }

    const engine = new PlayEngine({
      canvas,
      theme,
      settings,
      audioSynth,
    });

    const focusSurface = () => {
      requestAnimationFrame(() => {
        focusTarget.focus({ preventScroll: true });
      });
    };

    const resolvePosition = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const handleResize = () => engine.resize();
    const handleKeyDown = (event: KeyboardEvent) => {
      const next = pushParentSequence(parentBufferRef.current, event.key);
      parentBufferRef.current = next.nextBuffer;
      if (next.matched) {
        parentBufferRef.current = "";
        event.preventDefault();
        onParentSequence();
        return;
      }

      void audioSynth.unlock();
      engine.handleKey(event);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }
      const { x, y } = resolvePosition(event.clientX, event.clientY);
      engine.handlePointerMove(x, y);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }
      focusSurface();
      void audioSynth.unlock();
      const { x, y } = resolvePosition(event.clientX, event.clientY);
      engine.handlePress(x, y);
    };
    const handleTouchStart = (event: TouchEvent) => {
      focusSurface();
      void audioSynth.unlock();
      event.preventDefault();
      for (const touch of Array.from(event.changedTouches)) {
        const { x, y } = resolvePosition(touch.clientX, touch.clientY);
        engine.handlePress(x, y);
      }
    };
    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      for (const touch of Array.from(event.changedTouches)) {
        const { x, y } = resolvePosition(touch.clientX, touch.clientY);
        engine.handlePointerMove(x, y);
      }
    };

    engine.start();
    focusSurface();
    window.render_game_to_text = () => engine.getRenderText();
    window.advanceTime = (ms: number) => engine.advanceTime(ms);

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("resize", handleResize);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    focusTarget.addEventListener("blur", focusSurface);

    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
      engine.stop();
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      focusTarget.removeEventListener("blur", focusSurface);
    };
  }, [audioSynth, onParentSequence, settings, theme]);

  return (
    <div
      ref={containerRef}
      className={`${styles.surface} ${styles[theme.background.style]}`}
    >
      <div className={styles.surfaceGlow} />
      <canvas ref={canvasRef} className={styles.canvas} />
      <div
        ref={focusRef}
        className={styles.focusProxy}
        aria-hidden="true"
        tabIndex={0}
      />
    </div>
  );
}

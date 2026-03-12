import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef } from "react";

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

type MotionVariant =
  | "letter"
  | "cloud"
  | "leaf"
  | "bubble"
  | "star"
  | "comet"
  | "confetti"
  | "spark";

interface MotionSprite {
  id: string;
  variant: MotionVariant;
  content?: string;
  style: CSSProperties;
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
  const motionSprites = useMemo(
    () =>
      settings.animatedBackground && !settings.reduceMotion
        ? backgroundMotionSprites[theme.background.style]
        : [],
    [settings.animatedBackground, settings.reduceMotion, theme.background.style],
  );

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
      className={`${styles.surface} ${styles[theme.background.style]} ${
        settings.animatedBackground && !settings.reduceMotion ? styles.animated : ""
      }`}
    >
      <div className={styles.surfaceGlow} />
      {motionSprites.length > 0 ? (
        <div
          aria-hidden="true"
          className={styles.motionLayer}
          data-motion-style={theme.background.style}
          data-testid="background-motion"
        >
          {motionSprites.map((sprite) => (
            <span
              key={sprite.id}
              className={`${styles.motionSprite} ${styles[sprite.variant]}`}
              style={sprite.style}
            >
              {sprite.content ? (
                <span className={styles.motionGlyph}>{sprite.content}</span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
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

const backgroundMotionSprites: Record<ThemePack["background"]["style"], MotionSprite[]> = {
  dots: [
    sprite("letter-a", "letter", "A", 8, 16, 42, 20, -18, 0.55, 0),
    sprite("letter-b", "letter", "B", 22, 72, 56, 24, -22, 0.42, 4),
    sprite("letter-c", "letter", "C", 41, 30, 48, -16, -18, 0.46, 8),
    sprite("letter-1", "letter", "1", 58, 82, 44, 18, -22, 0.38, 2),
    sprite("letter-2", "letter", "2", 72, 20, 60, -20, -18, 0.48, 6),
    sprite("letter-3", "letter", "3", 84, 62, 50, 14, -20, 0.4, 10),
  ],
  clouds: [
    sprite("cloud-1", "cloud", undefined, 10, 14, 72, 62, 4, 0.28, 0),
    sprite("cloud-2", "cloud", undefined, 62, 18, 94, 54, -8, 0.24, 6),
    sprite("cloud-3", "cloud", undefined, 28, 68, 80, 58, 6, 0.26, 10),
    sprite("leaf-1", "leaf", undefined, 18, 42, 28, 18, 12, 0.34, 3),
    sprite("leaf-2", "leaf", undefined, 74, 58, 34, -16, 8, 0.32, 9),
    sprite("leaf-3", "leaf", undefined, 86, 28, 26, -12, 14, 0.29, 13),
  ],
  waves: [
    riseSprite("bubble-1", "bubble", 12, 88, 28, 16, -92, 0.34, 0),
    riseSprite("bubble-2", "bubble", 24, 102, 18, 8, -108, 0.28, 4),
    riseSprite("bubble-3", "bubble", 41, 94, 36, -10, -96, 0.26, 8),
    riseSprite("bubble-4", "bubble", 58, 108, 24, 14, -118, 0.32, 2),
    riseSprite("bubble-5", "bubble", 76, 96, 42, -8, -104, 0.24, 7),
    riseSprite("bubble-6", "bubble", 88, 110, 22, 10, -120, 0.3, 11),
  ],
  stars: [
    sprite("star-1", "star", "✦", 9, 18, 24, 18, -8, 0.58, 0),
    sprite("star-2", "star", "✧", 23, 62, 18, 16, 6, 0.46, 6),
    sprite("star-3", "star", "✦", 46, 28, 28, 20, -10, 0.54, 10),
    sprite("star-4", "star", "✶", 68, 74, 20, 14, 8, 0.5, 14),
    sprite("comet-1", "comet", undefined, 12, 34, 70, 36, -12, 0.32, 2),
    sprite("comet-2", "comet", undefined, 72, 16, 84, 42, 10, 0.28, 11),
  ],
  confetti: [
    sprite("confetti-1", "confetti", undefined, 11, 18, 18, 16, 18, 0.42, 0),
    sprite("confetti-2", "confetti", undefined, 26, 74, 22, -14, 20, 0.38, 5),
    sprite("confetti-3", "confetti", undefined, 43, 28, 20, 18, 16, 0.4, 9),
    sprite("confetti-4", "confetti", undefined, 67, 64, 24, -10, 18, 0.36, 12),
    sprite("spark-1", "spark", "✦", 80, 20, 24, 14, -6, 0.48, 3),
    sprite("spark-2", "spark", "✧", 88, 80, 20, -12, 10, 0.44, 10),
  ],
};

function sprite(
  id: string,
  variant: MotionVariant,
  content: string | undefined,
  left: number,
  top: number,
  size: number,
  driftX: number,
  driftY: number,
  opacity: number,
  delay: number,
) {
  return {
    id,
    variant,
    content,
    style: {
      "--left": `${left}%`,
      "--top": `${top}%`,
      "--size": `${size}px`,
      "--drift-x": `${driftX}px`,
      "--drift-y": `${driftY}px`,
      "--opacity": `${opacity}`,
      "--opacity-soft": `${Math.max(0.12, opacity * 0.72)}`,
      "--opacity-fade": "0.08",
      "--delay": `${delay}s`,
      "--duration": `${18 + delay}s`,
    } as CSSProperties,
  };
}

function riseSprite(
  id: string,
  variant: MotionVariant,
  left: number,
  top: number,
  size: number,
  driftX: number,
  travelY: number,
  opacity: number,
  delay: number,
) {
  return {
    id,
    variant,
    style: {
      "--left": `${left}%`,
      "--top": `${top}%`,
      "--size": `${size}px`,
      "--drift-x": `${driftX}px`,
      "--travel-y": `${travelY}vh`,
      "--opacity": `${opacity}`,
      "--opacity-soft": `${Math.max(0.12, opacity * 0.72)}`,
      "--opacity-fade": "0.08",
      "--delay": `${delay}s`,
      "--duration": `${20 + delay}s`,
    } as CSSProperties,
  };
}

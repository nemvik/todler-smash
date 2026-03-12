import { resolveAssetUrl } from "@/lib/theme/themeUtils";
import { clamp, pickRandom, randomBetween } from "@/lib/utils";
import type { AudioSynth } from "@/lib/audio/synth";
import type {
  ParentSettings,
  PlayRenderSnapshot,
  ReactionKind,
  ThemeItem,
  ThemePack,
} from "@/types/app";

interface EngineReaction {
  id: number;
  kind: ReactionKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  ttl: number;
  life: number;
  rotation: number;
  spin: number;
  label: string;
  isText: boolean;
  assetId?: string;
}

interface PlayEngineOptions {
  canvas: HTMLCanvasElement;
  theme: ThemePack;
  settings: ParentSettings;
  audioSynth: AudioSynth;
}

const MAX_ACTIVE_REACTIONS = 72;
const TRAIL_INTERVAL_MS = 100;

export class PlayEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly audioSynth: AudioSynth;
  private theme: ThemePack;
  private settings: ParentSettings;
  private reactions: EngineReaction[] = [];
  private frameHandle = 0;
  private lastFrame = 0;
  private lastTrailAt = 0;
  private lastIdleSpawnAt = 0;
  private lastInteractionAt = performance.now();
  private totalInteractions = 0;
  private comboCount = 0;
  private lastKind: ReactionKind | null = null;
  private reactionId = 0;
  private images = new Map<string, HTMLImageElement>();

  constructor(options: PlayEngineOptions) {
    this.canvas = options.canvas;
    this.context = options.canvas.getContext("2d")!;
    this.theme = options.theme;
    this.settings = options.settings;
    this.audioSynth = options.audioSynth;
    this.primeAssets();
    this.resize();
  }

  start() {
    this.lastFrame = performance.now();
    this.loop = this.loop.bind(this);
    this.frameHandle = requestAnimationFrame(this.loop);
  }

  stop() {
    cancelAnimationFrame(this.frameHandle);
    this.reactions = [];
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resize() {
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.round(width * ratio));
    this.canvas.height = Math.max(1, Math.round(height * ratio));
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  updateTheme(theme: ThemePack) {
    this.theme = theme;
    this.primeAssets();
  }

  updateSettings(settings: ParentSettings) {
    this.settings = settings;
  }

  handleKey(event: KeyboardEvent) {
    if ([" ", "Spacebar", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Backspace"].includes(event.key)) {
      event.preventDefault();
    }

    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const x = randomBetween(110, this.canvas.clientWidth - 110);
    const y = randomBetween(110, this.canvas.clientHeight - 110);
    const safeX = clamp(x, 48, Math.max(48, this.canvas.clientWidth - 48));
    const safeY = clamp(y, 48, Math.max(48, this.canvas.clientHeight - 48));
    const special = this.theme.specialKeys[event.key] ?? this.theme.specialKeys[event.code];
    const printable = event.key.length === 1;
    const displayLabel =
      printable && this.theme.id === "abc"
        ? event.key.toUpperCase()
        : special?.label?.[this.settings.language] ??
          this.keyLabel(event.key, event.code);
    const item = special?.itemId
      ? this.theme.items.find((candidate) => candidate.id === special.itemId) ??
        this.pickItem()
      : this.pickItem();

    this.spawnReactionCluster({
      x: safeX,
      y: safeY,
      kind: "key",
      strength: special?.intensity ?? (printable ? 1 : 1.15),
      item,
      textLabel: printable && this.theme.id === "abc" ? displayLabel : undefined,
    });

    this.playForInteraction(special?.sound);
    this.registerInteraction("key");
  }

  handlePointerMove(x: number, y: number) {
    const now = performance.now();
    if (now - this.lastTrailAt < TRAIL_INTERVAL_MS) {
      return;
    }

    this.lastTrailAt = now;
    this.spawnReactionCluster({
      x,
      y,
      kind: "trail",
      strength: 0.55,
      item: this.pickItem(),
    });
    this.playForInteraction("bubble", 0.5);
    this.registerInteraction("trail", false);
  }

  handlePress(x: number, y: number) {
    this.spawnReactionCluster({
      x,
      y,
      kind: "tap",
      strength: 1.3,
      item: this.pickItem(),
    });
    this.playForInteraction(undefined, 1.1);
    this.registerInteraction("tap");
  }

  advanceTime(ms: number) {
    const chunk = 1000 / 60;
    let remaining = ms;

    while (remaining > 0) {
      const step = Math.min(chunk, remaining);
      this.step(step / 1000);
      remaining -= step;
    }

    this.render();
  }

  getRenderText() {
    const payload: PlayRenderSnapshot = {
      coordinateSystem: "origin: top-left, x grows right, y grows down",
      themeId: this.theme.id,
      activeReactions: this.reactions.length,
      comboCount: this.comboCount,
      totalInteractions: this.totalInteractions,
      idleActive: this.isIdleActive(),
      reducedMotion: this.settings.reduceMotion,
      lastKind: this.lastKind,
    };

    return JSON.stringify(payload);
  }

  private loop(frameTime: number) {
    const delta = Math.min((frameTime - this.lastFrame) / 1000, 0.05);
    this.lastFrame = frameTime;
    this.step(delta);
    this.render();
    this.frameHandle = requestAnimationFrame(this.loop);
  }

  private step(delta: number) {
    for (const reaction of this.reactions) {
      reaction.life += delta * 1000;
      reaction.x += reaction.vx * delta;
      reaction.y += reaction.vy * delta;
      reaction.rotation += reaction.spin * delta;
      reaction.vy += 12 * delta;
    }

    this.reactions = this.reactions.filter((reaction) => reaction.life < reaction.ttl);

    if (
      this.settings.idleMode &&
      this.isIdleActive() &&
      performance.now() - this.lastIdleSpawnAt > 820
    ) {
      this.lastIdleSpawnAt = performance.now();
      this.spawnReactionCluster({
        x: this.safeCoord(this.canvas.clientWidth),
        y: this.safeCoord(this.canvas.clientHeight),
        kind: "idle",
        strength: 0.42,
        item: this.pickItem(),
      });
    }
  }

  private render() {
    this.context.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

    for (const reaction of this.reactions) {
      const alpha = 1 - reaction.life / reaction.ttl;
      const scale = reaction.size * (0.78 + alpha * 0.28);
      this.context.save();
      this.context.translate(reaction.x, reaction.y);
      this.context.rotate(reaction.rotation);
      this.context.globalAlpha = clamp(alpha, 0, 1);
      this.context.shadowColor = "rgba(18, 34, 68, 0.18)";
      this.context.shadowBlur = Math.max(6, scale * 0.16);
      this.context.shadowOffsetY = Math.max(2, scale * 0.05);

      if (reaction.isText) {
        this.context.fillStyle = this.theme.palette.ink;
        this.context.font = `700 ${Math.round(scale * 0.9)}px ui-rounded, "Trebuchet MS", sans-serif`;
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillText(reaction.label, 0, 2);
      } else if (reaction.assetId) {
        const image = this.images.get(reaction.assetId);
        if (image?.complete) {
          this.context.globalAlpha = alpha;
          this.context.drawImage(image, -scale * 0.7, -scale * 0.7, scale * 1.4, scale * 1.4);
        } else {
          this.context.fillStyle = this.theme.palette.ink;
          this.context.font = `700 ${Math.round(scale * 0.8)}px ui-rounded, sans-serif`;
          this.context.textAlign = "center";
          this.context.textBaseline = "middle";
          this.context.fillText("•", 0, 0);
        }
      } else {
        this.context.fillStyle = this.theme.palette.ink;
        this.context.font = `700 ${Math.round(scale * 0.82)}px ui-rounded, sans-serif`;
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillText(reaction.label, 0, 2);
      }

      this.context.restore();
    }
  }

  private spawnReactionCluster(options: {
    x: number;
    y: number;
    kind: ReactionKind;
    strength: number;
    item: ThemeItem;
    textLabel?: string;
  }) {
    const densityBase =
      options.kind === "trail"
        ? 1
        : options.kind === "idle"
          ? 1
          : options.kind === "combo"
            ? this.settings.burstCount + 1
            : this.settings.burstCount;
    const motionScale = this.settings.reduceMotion ? 0.55 : 1;
    const count = Math.max(
      1,
      Math.round(densityBase * motionScale),
    );

    for (let index = 0; index < count; index += 1) {
      const spread = options.kind === "trail" ? 24 : 44;
      const direction = randomBetween(-1, 1);
      const lift = options.kind === "trail" ? -20 : -40;
      const size =
        randomBetween(26, 42) *
        options.strength *
        this.settings.intensity *
        (this.settings.reduceMotion ? 0.86 : 1);

      this.reactions.push({
        id: this.reactionId++,
        kind: options.kind,
        x: options.x + randomBetween(-spread, spread),
        y: options.y + randomBetween(-spread, spread),
        vx: direction * randomBetween(12, 54) * motionScale,
        vy: randomBetween(lift - 20, lift + 4) * motionScale,
        size,
        ttl:
          clamp(this.settings.fadeMs, 1200, 2200) *
          (options.kind === "trail" ? 0.75 : 1),
        life: 0,
        rotation: randomBetween(-0.25, 0.25),
        spin: randomBetween(-0.8, 0.8) * motionScale,
        label:
          options.textLabel ??
          (options.item.type === "emoji"
            ? options.item.value
            : options.item.label[this.settings.language]),
        isText: Boolean(options.textLabel) || options.item.type === "emoji",
        assetId:
          !options.textLabel && options.item.type === "asset"
            ? options.item.value
            : undefined,
      });
    }

    if (this.reactions.length > MAX_ACTIVE_REACTIONS) {
      this.reactions = this.reactions.slice(-MAX_ACTIVE_REACTIONS);
    }
  }

  private registerInteraction(kind: ReactionKind, increment = true) {
    this.lastInteractionAt = performance.now();
    this.lastKind = kind;

    if (!increment) {
      return;
    }

    this.totalInteractions += 1;
    if (this.totalInteractions % 10 === 0) {
      this.comboCount += 1;
      this.spawnReactionCluster({
        x: this.safeCoord(this.canvas.clientWidth),
        y: this.safeCoord(this.canvas.clientHeight),
        kind: "combo",
        strength: 1.55,
        item: this.pickItem(),
      });
      this.playForInteraction("celebrate", 1.15);
    }
  }

  private playForInteraction(preset?: string, gainBoost = 1) {
    if (!this.settings.soundEnabled) {
      return;
    }

    const soundPreset =
      (preset as Parameters<AudioSynth["play"]>[0] | undefined) ??
      pickRandom(this.theme.soundPack);

    this.audioSynth.play(soundPreset, {
      volume: this.settings.volume * gainBoost,
      pan: randomBetween(-0.45, 0.45),
    });
  }

  private pickItem() {
    return pickRandom(this.theme.items);
  }

  private isIdleActive() {
    return performance.now() - this.lastInteractionAt > 6000;
  }

  private primeAssets() {
    for (const assetId of this.theme.assetRefs) {
      if (this.images.has(assetId)) {
        continue;
      }

      const source = resolveAssetUrl(assetId);
      if (!source) {
        continue;
      }

      const image = new Image();
      image.src = source;
      this.images.set(assetId, image);
    }
  }

  private keyLabel(key: string, code: string) {
    if (key === " ") {
      return "SPACE";
    }

    if (key.startsWith("Arrow")) {
      return key.replace("Arrow", "").toUpperCase();
    }

    if (key.length === 1) {
      return key.toUpperCase();
    }

    return code.replace("Key", "").replace("Digit", "").toUpperCase();
  }

  private safeCoord(size: number) {
    return clamp(randomBetween(72, size - 72), 48, Math.max(48, size - 48));
  }
}

export type Language = "cs" | "en";

export type LocalizedString = Record<Language, string>;

export type SoundPresetId =
  | "bloop"
  | "chirp"
  | "bubble"
  | "pluck"
  | "whoosh"
  | "celebrate";

export type ParticleStyle =
  | "letters"
  | "stars"
  | "comets"
  | "bubbles"
  | "confetti";

export type ReactionKind = "key" | "trail" | "tap" | "idle" | "combo";

export interface ThemePalette {
  base: string;
  baseAlt: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  outline: string;
  accent: string;
  accent2: string;
  accent3: string;
  glow: string;
  shadow: string;
}

export interface ThemeBackground {
  style: "clouds" | "dots" | "waves" | "stars" | "confetti";
  gradient: [string, string];
  accentGradient?: [string, string];
  patternOpacity: number;
}

export interface ThemeItem {
  id: string;
  type: "emoji" | "asset";
  value: string;
  label: LocalizedString;
  weight?: number;
  scale?: number;
}

export interface SpecialKeyBehavior {
  reaction: "burst" | "wave" | "stomp" | "rocket" | "splash";
  sound?: SoundPresetId;
  label?: LocalizedString;
  intensity?: number;
  itemId?: string;
}

export interface ThemeLabels {
  cta: LocalizedString;
  playHint: LocalizedString;
  parentHint: LocalizedString;
  idleLabel: LocalizedString;
  comboLabel: LocalizedString;
}

export interface ThemeDefaults {
  volume: number;
  intensity: number;
  fadeMs: number;
  reduceMotion: boolean;
  idleMode: boolean;
}

export interface ThemePack {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  icon: string;
  palette: ThemePalette;
  background: ThemeBackground;
  items: ThemeItem[];
  assetRefs: string[];
  soundPack: SoundPresetId[];
  particleStyle: ParticleStyle;
  specialKeys: Record<string, SpecialKeyBehavior>;
  labels: ThemeLabels;
  defaults: ThemeDefaults;
}

export interface ParentSettings {
  themeId: string;
  soundEnabled: boolean;
  volume: number;
  intensity: number;
  burstCount: number;
  fadeMs: number;
  reduceMotion: boolean;
  idleMode: boolean;
  preferFullscreen: boolean;
  keyboardLockEnabled: boolean;
  wakeLockEnabled: boolean;
  language: Language;
  pinHash: string | null;
}

export interface BrowserCapabilities {
  fullscreen: boolean;
  fullscreenOptions: boolean;
  keyboardLock: boolean;
  wakeLock: boolean;
  touch: boolean;
}

export interface ThemePackFile {
  kind: "theme-pack";
  schemaVersion: 1;
  theme: ThemePack;
}

export interface ParentConfigFile {
  kind: "parent-config";
  schemaVersion: 1;
  settings: ParentSettings;
  themeOverrides: Record<string, Partial<ThemePack>>;
  customThemes: ThemePack[];
}

export interface AppStorageSnapshot {
  settings: ParentSettings;
  themeOverrides: Record<string, Partial<ThemePack>>;
  customThemes: ThemePack[];
}

export interface EffectiveTheme {
  theme: ThemePack;
  backgroundStyle: Record<string, string>;
}

export interface PlayRenderSnapshot {
  coordinateSystem: string;
  themeId: string;
  activeReactions: number;
  comboCount: number;
  totalInteractions: number;
  idleActive: boolean;
  reducedMotion: boolean;
  lastKind: ReactionKind | null;
}

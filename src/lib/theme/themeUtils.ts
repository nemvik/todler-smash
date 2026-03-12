import { assetRegistry } from "@/content/assets";
import type {
  AppStorageSnapshot,
  Language,
  LocalizedString,
  ParentConfigFile,
  ParentSettings,
  ThemePack,
  ThemePackFile,
} from "@/types/app";
import { clamp, deepClone } from "@/lib/utils";

export function isLocalizedString(value: unknown): value is LocalizedString {
  return Boolean(
    value &&
      typeof value === "object" &&
      "cs" in (value as Record<string, unknown>) &&
      "en" in (value as Record<string, unknown>),
  );
}

export function isThemePack(value: unknown): value is ThemePack {
  if (!value || typeof value !== "object") {
    return false;
  }

  const theme = value as ThemePack;
  return (
    typeof theme.id === "string" &&
    isLocalizedString(theme.name) &&
    isLocalizedString(theme.description) &&
    typeof theme.icon === "string" &&
    Array.isArray(theme.items) &&
    Array.isArray(theme.assetRefs) &&
    Array.isArray(theme.soundPack)
  );
}

export function mergeTheme(baseTheme: ThemePack, override?: Partial<ThemePack>) {
  if (!override) {
    return deepClone(baseTheme);
  }

  return {
    ...baseTheme,
    ...override,
    palette: {
      ...baseTheme.palette,
      ...override.palette,
    },
    background: {
      ...baseTheme.background,
      ...override.background,
    },
    labels: {
      ...baseTheme.labels,
      ...override.labels,
    },
    defaults: {
      ...baseTheme.defaults,
      ...override.defaults,
    },
    items: override.items ?? deepClone(baseTheme.items),
    assetRefs: override.assetRefs ?? [...baseTheme.assetRefs],
    soundPack: override.soundPack ?? [...baseTheme.soundPack],
    specialKeys: {
      ...baseTheme.specialKeys,
      ...override.specialKeys,
    },
  } satisfies ThemePack;
}

export function mergeThemes(
  builtInThemes: ThemePack[],
  overrides: Record<string, Partial<ThemePack>>,
  customThemes: ThemePack[],
) {
  const baseThemes = builtInThemes.map((theme) =>
    mergeTheme(theme, overrides[theme.id]),
  );

  const customThemeMap = new Map(
    customThemes.map((theme) => [theme.id, deepClone(theme)]),
  );

  for (const [themeId, override] of Object.entries(overrides)) {
    if (customThemeMap.has(themeId)) {
      customThemeMap.set(themeId, mergeTheme(customThemeMap.get(themeId)!, override));
    }
  }

  return [...baseThemes, ...customThemeMap.values()];
}

export function createDefaultSettings(theme: ThemePack, language: Language) {
  return {
    themeId: theme.id,
    soundEnabled: true,
    volume: clamp(theme.defaults.volume, 0, 1),
    intensity: clamp(theme.defaults.intensity, 0.4, 1.8),
    burstCount: 2,
    fadeMs: clamp(theme.defaults.fadeMs, 1200, 2200),
    animatedBackground: true,
    reduceMotion: theme.defaults.reduceMotion,
    idleMode: theme.defaults.idleMode,
    preferFullscreen: true,
    keyboardLockEnabled: false,
    wakeLockEnabled: false,
    language,
    pinHash: null,
  } satisfies ParentSettings;
}

export function resolveAssetUrl(assetId: string) {
  return assetRegistry[assetId as keyof typeof assetRegistry] ?? null;
}

export function themeToCssVariables(theme: ThemePack) {
  return {
    "--theme-base": theme.palette.base,
    "--theme-base-alt": theme.palette.baseAlt,
    "--theme-surface": theme.palette.surface,
    "--theme-surface-alt": theme.palette.surfaceAlt,
    "--theme-ink": theme.palette.ink,
    "--theme-outline": theme.palette.outline,
    "--theme-accent": theme.palette.accent,
    "--theme-accent-2": theme.palette.accent2,
    "--theme-accent-3": theme.palette.accent3,
    "--theme-glow": theme.palette.glow,
    "--theme-shadow": theme.palette.shadow,
    "--theme-gradient-a": theme.background.gradient[0],
    "--theme-gradient-b": theme.background.gradient[1],
    "--theme-pattern-opacity": `${theme.background.patternOpacity}`,
    "--theme-accent-gradient-a":
      theme.background.accentGradient?.[0] ?? theme.background.gradient[0],
    "--theme-accent-gradient-b":
      theme.background.accentGradient?.[1] ?? theme.background.gradient[1],
  } as Record<string, string>;
}

export function createThemeFile(theme: ThemePack): ThemePackFile {
  return {
    kind: "theme-pack",
    schemaVersion: 1,
    theme,
  };
}

export function createConfigFile(
  snapshot: AppStorageSnapshot,
): ParentConfigFile {
  return {
    kind: "parent-config",
    schemaVersion: 1,
    settings: snapshot.settings,
    themeOverrides: snapshot.themeOverrides,
    customThemes: snapshot.customThemes,
  };
}

export function isThemePackFile(value: unknown): value is ThemePackFile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const file = value as ThemePackFile;
  return (
    file.kind === "theme-pack" &&
    file.schemaVersion === 1 &&
    isThemePack(file.theme)
  );
}

export function isParentConfigFile(value: unknown): value is ParentConfigFile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const file = value as ParentConfigFile;
  return (
    file.kind === "parent-config" &&
    file.schemaVersion === 1 &&
    Boolean(file.settings) &&
    Array.isArray(file.customThemes)
  );
}

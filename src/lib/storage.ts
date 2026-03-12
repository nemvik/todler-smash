import type { AppStorageSnapshot, ParentSettings, ThemePack } from "@/types/app";
import { safeJsonParse } from "@/lib/utils";

const SETTINGS_KEY = "bublbac.v1.settings";
const OVERRIDES_KEY = "bublbac.v1.theme-overrides";
const CUSTOM_THEMES_KEY = "bublbac.v1.custom-themes";

export function loadStoredSettings(fallback: ParentSettings) {
  const parsed = safeJsonParse<ParentSettings>(
    localStorage.getItem(SETTINGS_KEY) ?? "",
  );

  return parsed ? { ...fallback, ...parsed } : fallback;
}

export function saveStoredSettings(settings: ParentSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadThemeOverrides() {
  return (
    safeJsonParse<Record<string, Partial<ThemePack>>>(
      localStorage.getItem(OVERRIDES_KEY) ?? "",
    ) ?? {}
  );
}

export function saveThemeOverrides(overrides: Record<string, Partial<ThemePack>>) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

export function loadCustomThemes() {
  return (
    safeJsonParse<ThemePack[]>(localStorage.getItem(CUSTOM_THEMES_KEY) ?? "") ?? []
  );
}

export function saveCustomThemes(customThemes: ThemePack[]) {
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(customThemes));
}

export function saveSnapshot(snapshot: AppStorageSnapshot) {
  saveStoredSettings(snapshot.settings);
  saveThemeOverrides(snapshot.themeOverrides);
  saveCustomThemes(snapshot.customThemes);
}

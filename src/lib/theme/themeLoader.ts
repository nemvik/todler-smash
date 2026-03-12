import type { ThemePack } from "@/types/app";
import { isThemePack } from "@/lib/theme/themeUtils";

const themeModules = import.meta.glob("@/content/themes/*.json", {
  eager: true,
}) as Record<string, { default: ThemePack }>;

export function loadBuiltInThemes() {
  return Object.values(themeModules)
    .map((module) => module.default)
    .filter(isThemePack)
    .sort((left, right) => left.name.cs.localeCompare(right.name.cs));
}

import type { CSSProperties } from "react";

import { localize } from "@/lib/i18n";
import { themeToCssVariables } from "@/lib/theme/themeUtils";
import type { Language, ThemePack } from "@/types/app";
import styles from "@/styles/ThemePreview.module.css";

interface ThemePreviewProps {
  theme: ThemePack;
  language: Language;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export function ThemePreview({
  theme,
  language,
  selected = false,
  compact = false,
  onClick,
}: ThemePreviewProps) {
  const sampleItems = theme.items.slice(0, compact ? 4 : 5);

  return (
    <button
      type="button"
      className={`${styles.card} ${selected ? styles.selected : ""} ${compact ? styles.compact : ""}`}
      onClick={onClick}
      style={themeToCssVariables(theme) as CSSProperties}
    >
      <div className={`${styles.preview} ${styles[theme.background.style]}`}>
        <div className={styles.badge}>{theme.icon}</div>
        <div className={styles.samples}>
          {sampleItems.map((item) => (
            <span key={item.id} className={styles.sampleChip}>
              {item.type === "emoji" ? item.value : "✦"}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.meta}>
        <strong>{localize(theme.name, language)}</strong>
        <span>{localize(theme.description, language)}</span>
      </div>
    </button>
  );
}

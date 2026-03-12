import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/app";
import styles from "@/styles/ParentSupportLink.module.css";

interface ParentSupportLinkProps {
  language: Language;
  className?: string;
}

export function ParentSupportLink({
  language,
  className,
}: ParentSupportLinkProps) {
  const supportUrl = siteConfig.supportUrl.trim();

  if (!siteConfig.supportEnabled || !supportUrl) {
    return null;
  }

  const supportLabel =
    language === "cs" ? siteConfig.supportLabelCs : siteConfig.supportLabelEn;
  const supportNote =
    language === "cs" ? siteConfig.supportNoteCs : siteConfig.supportNoteEn;

  return (
    <div className={cn(styles.supportBlock, className)}>
      <p className={styles.note}>{supportNote}</p>
      <a
        className={styles.link}
        data-testid="support-link"
        href={supportUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        {supportLabel}
      </a>
    </div>
  );
}

import { Globe2, LockKeyhole, Sparkles, Volume2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { ParentSupportLink } from "@/components/shared/ParentSupportLink";
import { Button } from "@/components/ui/button";
import { useAppSession } from "@/providers/AppSessionProvider";
import { ThemePreview } from "@/components/shared/ThemePreview";
import styles from "@/styles/LandingPage.module.css";

const helpIconMap = [LockKeyhole, Sparkles, Globe2, Volume2];

export function LandingPage() {
  const navigate = useNavigate();
  const {
    activeTheme,
    bootstrapPlay,
    copy,
    settings,
    setThemeId,
    updateSettings,
    themes,
  } = useAppSession();

  const helpCards = [
    { title: copy.guidedAccessTitle, body: copy.guidedAccessBody },
    { title: copy.androidPinningTitle, body: copy.androidPinningBody },
    { title: copy.exitFullscreenTitle, body: copy.exitFullscreenBody },
    { title: copy.quietModeTitle, body: copy.quietModeBody },
  ];

  async function handleStartPlay() {
    await bootstrapPlay(activeTheme.id);
    navigate("/play");
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.brandBadge}>{copy.brand}</span>
          <h1>{copy.shortTagline}</h1>
          <p>{copy.landingIntro}</p>
          <div className={styles.actions}>
            <Button className={styles.startButton} size="lg" onClick={handleStartPlay}>
              {copy.startPlay}
            </Button>
            <button
              type="button"
              className={styles.languageButton}
              onClick={() =>
                updateSettings({
                  language: settings.language === "cs" ? "en" : "cs",
                })
              }
            >
              {copy.switchLanguage}
            </button>
          </div>
          <p className={styles.fullscreenNotice}>{copy.fullscreenNotice}</p>
          <div className={styles.parentZone}>
            <ParentSupportLink language={settings.language} />
          </div>
        </div>

        <div className={styles.heroArt} aria-hidden="true">
          <div className={styles.orbit} />
          <div className={styles.cloud} />
          <div className={styles.bubbleA}>{activeTheme.icon}</div>
          <div className={styles.bubbleB}>✦</div>
          <div className={styles.bubbleC}>◌</div>
        </div>
      </section>

      <section className={styles.themeSection}>
        <div className={styles.themeHeading}>
          <h2>{copy.pickTheme}</h2>
          <Link to="/parent/studio" className={styles.studioLink}>
            {copy.studio}
          </Link>
        </div>
        <div className={styles.themeGrid}>
          {themes.map((theme) => (
            <ThemePreview
              key={theme.id}
              language={settings.language}
              selected={theme.id === activeTheme.id}
              theme={theme}
              onClick={() => setThemeId(theme.id)}
            />
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerHeader}>
          <h3>{copy.helpTitle}</h3>
          <p>{copy.footerHelp}</p>
        </div>
        <div className={styles.helpGrid}>
          {helpCards.map((card, index) => {
            const Icon = helpIconMap[index];
            return (
              <article key={card.title} className={styles.helpCard}>
                <Icon className={styles.helpIcon} />
                <strong>{card.title}</strong>
                <p>{card.body}</p>
              </article>
            );
          })}
        </div>
      </footer>
    </div>
  );
}

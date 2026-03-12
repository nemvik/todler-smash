import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { themeToCssVariables } from "@/lib/theme/themeUtils";
import { cn } from "@/lib/utils";
import { useAppSession } from "@/providers/AppSessionProvider";
import styles from "@/styles/AppShell.module.css";

export function AppShell() {
  const location = useLocation();
  const { activeTheme, shellRef } = useAppSession();
  const isPlayRoute = location.pathname === "/play";

  useEffect(() => {
    document.body.dataset.playRoute = isPlayRoute ? "true" : "false";
    return () => {
      delete document.body.dataset.playRoute;
    };
  }, [isPlayRoute]);

  return (
    <div
      ref={shellRef}
      className={cn(styles.shell, isPlayRoute && styles.playMode)}
      style={themeToCssVariables(activeTheme)}
    >
      <div
        className={cn(styles.ambient, styles[activeTheme.background.style])}
        aria-hidden="true"
      />
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

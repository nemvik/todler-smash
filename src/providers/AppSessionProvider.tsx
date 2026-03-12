import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AudioSynth } from "@/lib/audio/synth";
import { getBrowserCapabilities } from "@/lib/browser/capabilities";
import {
  exitAppFullscreen,
  releaseKeyboardLock,
  requestAppFullscreen,
  requestKeyboardLock,
  requestWakeLock,
} from "@/lib/browser/fullscreen";
import { getCopy } from "@/lib/i18n";
import {
  loadCustomThemes,
  loadStoredSettings,
  loadThemeOverrides,
  saveSnapshot,
} from "@/lib/storage";
import { loadBuiltInThemes } from "@/lib/theme/themeLoader";
import {
  createConfigFile,
  createDefaultSettings,
  createThemeFile,
  isParentConfigFile,
  isThemePack,
  isThemePackFile,
  mergeThemes,
} from "@/lib/theme/themeUtils";
import { safeJsonParse } from "@/lib/utils";
import type {
  AppStorageSnapshot,
  BrowserCapabilities,
  ParentSettings,
  ThemePack,
} from "@/types/app";

interface AppSessionContextValue {
  shellRef: React.RefObject<HTMLDivElement | null>;
  audioSynth: AudioSynth;
  themes: ThemePack[];
  activeTheme: ThemePack;
  builtInThemeIds: Set<string>;
  settings: ParentSettings;
  capabilities: BrowserCapabilities;
  fullscreenActive: boolean;
  copy: ReturnType<typeof getCopy>;
  bootstrapPlay: (themeId?: string) => Promise<boolean>;
  setThemeId: (themeId: string) => void;
  updateSettings: (nextSettings: Partial<ParentSettings>) => void;
  resetSettings: () => void;
  saveThemeEdits: (theme: ThemePack) => void;
  resetTheme: (themeId: string) => void;
  exportConfigText: () => string;
  importConfigText: (text: string) => string | null;
  exportThemeText: (themeId: string) => string;
  importThemeText: (text: string) => string | null;
  setPinHash: (pinHash: string | null) => void;
  leaveFullscreen: () => Promise<void>;
}

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

export function AppSessionProvider({ children }: PropsWithChildren) {
  const shellRef = useRef<HTMLDivElement>(null);
  const audioSynthRef = useRef(new AudioSynth());
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const builtInThemes = useMemo(() => loadBuiltInThemes(), []);
  const builtInThemeIds = useMemo(
    () => new Set(builtInThemes.map((theme) => theme.id)),
    [builtInThemes],
  );
  const fallbackTheme = builtInThemes.find((theme) => theme.id === "abc") ?? builtInThemes[0];

  const [themeOverrides, setThemeOverrides] = useState<Record<string, Partial<ThemePack>>>(
    () => loadThemeOverrides(),
  );
  const [customThemes, setCustomThemes] = useState<ThemePack[]>(() =>
    loadCustomThemes().filter(isThemePack),
  );
  const [settings, setSettings] = useState<ParentSettings>(() =>
    loadStoredSettings(createDefaultSettings(fallbackTheme, "cs")),
  );
  const [fullscreenActive, setFullscreenActive] = useState(
    Boolean(document.fullscreenElement),
  );
  const [capabilities, setCapabilities] = useState<BrowserCapabilities>(() =>
    getBrowserCapabilities(),
  );

  const themes = useMemo(
    () => mergeThemes(builtInThemes, themeOverrides, customThemes),
    [builtInThemes, customThemes, themeOverrides],
  );
  const activeTheme =
    themes.find((theme) => theme.id === settings.themeId) ??
    themes[0] ??
    fallbackTheme;

  useEffect(() => {
    setCapabilities(getBrowserCapabilities());
  }, []);

  useEffect(() => {
    if (!themes.some((theme) => theme.id === settings.themeId)) {
      setSettings((current) => ({
        ...current,
        themeId: fallbackTheme.id,
      }));
    }
  }, [fallbackTheme.id, settings.themeId, themes]);

  useEffect(() => {
    const snapshot: AppStorageSnapshot = {
      settings,
      themeOverrides,
      customThemes,
    };
    saveSnapshot(snapshot);
  }, [customThemes, settings, themeOverrides]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreenActive(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    async function syncEnhancements() {
      if (!fullscreenActive) {
        releaseKeyboardLock();
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
        return;
      }

      if (settings.keyboardLockEnabled) {
        await requestKeyboardLock();
      }

      if (settings.wakeLockEnabled && !wakeLockRef.current) {
        const sentinel = await requestWakeLock();
        if (!disposed) {
          wakeLockRef.current = sentinel;
        }
      }
    }

    void syncEnhancements();

    return () => {
      disposed = true;
    };
  }, [fullscreenActive, settings.keyboardLockEnabled, settings.wakeLockEnabled]);

  const updateSettings = useCallback((nextSettings: Partial<ParentSettings>) => {
    setSettings((current) => ({ ...current, ...nextSettings }));
  }, []);

  const setThemeId = useCallback((themeId: string) => {
    setSettings((current) => ({ ...current, themeId }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(createDefaultSettings(activeTheme, settings.language));
  }, [activeTheme, settings.language]);

  const bootstrapPlay = useCallback(
    async (themeId?: string) => {
      if (themeId && themeId !== settings.themeId) {
        setThemeId(themeId);
      }

      await audioSynthRef.current.unlock();

      if (!settings.preferFullscreen || !shellRef.current) {
        return false;
      }

      return requestAppFullscreen(shellRef.current);
    },
    [setThemeId, settings.preferFullscreen, settings.themeId],
  );

  const saveThemeEdits = useCallback(
    (theme: ThemePack) => {
      if (builtInThemeIds.has(theme.id)) {
        setThemeOverrides((current) => ({
          ...current,
          [theme.id]: theme,
        }));
        return;
      }

      setCustomThemes((current) => {
        const remaining = current.filter((candidate) => candidate.id !== theme.id);
        return [...remaining, theme];
      });
    },
    [builtInThemeIds],
  );

  const resetTheme = useCallback(
    (themeId: string) => {
      if (builtInThemeIds.has(themeId)) {
        setThemeOverrides((current) => {
          const next = { ...current };
          delete next[themeId];
          return next;
        });
        return;
      }

      setCustomThemes((current) =>
        current.filter((theme) => theme.id !== themeId),
      );
    },
    [builtInThemeIds],
  );

  const exportConfigText = useCallback(() => {
    return JSON.stringify(
      createConfigFile({
        settings,
        themeOverrides,
        customThemes,
      }),
      null,
      2,
    );
  }, [customThemes, settings, themeOverrides]);

  const importConfigText = useCallback((text: string) => {
    const parsed = safeJsonParse<unknown>(text);

    if (!isParentConfigFile(parsed)) {
      return "Invalid config payload.";
    }

    setSettings(normalizeSettings(parsed.settings, fallbackTheme));
    setThemeOverrides(parsed.themeOverrides ?? {});
    setCustomThemes((parsed.customThemes ?? []).filter(isThemePack));
    return null;
  }, [fallbackTheme]);

  const exportThemeText = useCallback(
    (themeId: string) => {
      const theme = themes.find((candidate) => candidate.id === themeId) ?? activeTheme;
      return JSON.stringify(createThemeFile(theme), null, 2);
    },
    [activeTheme, themes],
  );

  const importThemeText = useCallback((text: string) => {
    const parsed = safeJsonParse<unknown>(text);

    if (!parsed) {
      return "JSON is not valid.";
    }

    const theme = isThemePackFile(parsed)
      ? parsed.theme
      : isThemePack(parsed)
        ? parsed
        : null;

    if (!theme) {
      return "Theme payload is not valid.";
    }

    if (builtInThemeIds.has(theme.id)) {
      setThemeOverrides((current) => ({
        ...current,
        [theme.id]: theme,
      }));
    } else {
      setCustomThemes((current) => {
        const remaining = current.filter((candidate) => candidate.id !== theme.id);
        return [...remaining, theme];
      });
    }

    setSettings((current) => ({
      ...current,
      themeId: theme.id,
    }));

    return null;
  }, [builtInThemeIds]);

  const setPinHash = useCallback((pinHash: string | null) => {
    setSettings((current) => ({
      ...current,
      pinHash,
    }));
  }, []);

  const leaveFullscreen = useCallback(async () => {
    await exitAppFullscreen();
  }, []);

  const value = useMemo<AppSessionContextValue>(
    () => ({
      shellRef,
      audioSynth: audioSynthRef.current,
      themes,
      activeTheme,
      builtInThemeIds,
      settings,
      capabilities,
      fullscreenActive,
      copy: getCopy(settings.language),
      bootstrapPlay,
      setThemeId,
      updateSettings,
      resetSettings,
      saveThemeEdits,
      resetTheme,
      exportConfigText,
      importConfigText,
      exportThemeText,
      importThemeText,
      setPinHash,
      leaveFullscreen,
    }),
    [
      activeTheme,
      bootstrapPlay,
      builtInThemeIds,
      capabilities,
      exportConfigText,
      exportThemeText,
      fullscreenActive,
      importConfigText,
      importThemeText,
      leaveFullscreen,
      resetSettings,
      resetTheme,
      saveThemeEdits,
      setPinHash,
      setThemeId,
      settings,
      themes,
      updateSettings,
    ],
  );

  return (
    <AppSessionContext.Provider value={value}>
      {children}
    </AppSessionContext.Provider>
  );
}

function normalizeSettings(
  settings: Partial<ParentSettings>,
  fallbackTheme: ThemePack,
) {
  return {
    ...createDefaultSettings(fallbackTheme, settings.language ?? "cs"),
    ...settings,
  };
}

export function useAppSession() {
  const context = useContext(AppSessionContext);
  if (!context) {
    throw new Error("useAppSession must be used inside AppSessionProvider");
  }

  return context;
}

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Download, RotateCcw, Upload } from "lucide-react";
import { Link } from "react-router-dom";

import { ParentSettingsControls } from "@/components/shared/ParentSettingsControls";
import { ThemePreview } from "@/components/shared/ThemePreview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { hashPin } from "@/lib/crypto";
import { downloadText, safeJsonParse } from "@/lib/utils";
import { useAppSession } from "@/providers/AppSessionProvider";
import type { ThemePack } from "@/types/app";
import styles from "@/styles/StudioPage.module.css";

export function ParentStudioPage() {
  const {
    activeTheme,
    builtInThemeIds,
    capabilities,
    copy,
    exportConfigText,
    exportThemeText,
    importConfigText,
    importThemeText,
    resetSettings,
    resetTheme,
    saveThemeEdits,
    setPinHash,
    setThemeId,
    settings,
    themes,
    updateSettings,
  } = useAppSession();
  const [selectedThemeId, setSelectedThemeId] = useState(activeTheme.id);
  const [themeJson, setThemeJson] = useState("");
  const [configJson, setConfigJson] = useState("");
  const [pinDraft, setPinDraft] = useState("");
  const [status, setStatus] = useState("");

  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.id === selectedThemeId) ?? activeTheme,
    [activeTheme, selectedThemeId, themes],
  );

  useEffect(() => {
    setThemeJson(JSON.stringify(selectedTheme, null, 2));
  }, [selectedTheme]);

  useEffect(() => {
    if (!themes.some((theme) => theme.id === selectedThemeId)) {
      setSelectedThemeId(activeTheme.id);
    }
  }, [activeTheme.id, selectedThemeId, themes]);

  function handleSaveThemeJson() {
    const parsed = safeJsonParse<ThemePack>(themeJson);
    if (!parsed) {
      setStatus("Theme JSON is not valid.");
      return;
    }

    saveThemeEdits(parsed);
    setSelectedThemeId(parsed.id);
    setThemeId(parsed.id);
    setStatus("Theme saved locally.");
  }

  function handleConfigImport() {
    const error = importConfigText(configJson);
    setStatus(error ?? "Config imported.");
  }

  function handleThemeImport() {
    const error = importThemeText(themeJson);
    setStatus(error ?? "Theme imported.");
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{copy.brand}</p>
          <h1>{copy.studio}</h1>
          <p>{copy.themeJsonHint}</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeftRight className="h-4 w-4" />
            {copy.backHome}
          </Link>
        </Button>
      </div>

      <div className={styles.grid}>
        <aside className={styles.sidebar}>
          <Card>
            <CardHeader>
              <CardTitle>{copy.livePreview}</CardTitle>
              <CardDescription>{selectedTheme.labels.playHint[settings.language]}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <ThemePreview compact language={settings.language} theme={selectedTheme} />
              <div className="grid gap-2">
                {themes.map((theme) => (
                  <ThemePreview
                    key={theme.id}
                    compact
                    language={settings.language}
                    selected={theme.id === selectedThemeId}
                    theme={theme}
                    onClick={() => {
                      setSelectedThemeId(theme.id);
                      setThemeId(theme.id);
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className={styles.main}>
          <Tabs defaultValue="theme">
            <TabsList>
              <TabsTrigger value="theme">{copy.builtInThemes}</TabsTrigger>
              <TabsTrigger value="settings">{copy.settings}</TabsTrigger>
              <TabsTrigger value="import-export">{copy.importExport}</TabsTrigger>
            </TabsList>

            <TabsContent value="theme">
              <Card>
                <CardHeader>
                  <CardTitle>{copy.customThemeJson}</CardTitle>
                  <CardDescription>
                    {builtInThemeIds.has(selectedTheme.id)
                      ? "Built-in theme override"
                      : "Custom theme"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Textarea
                    className={styles.jsonArea}
                    value={themeJson}
                    onChange={(event) => setThemeJson(event.target.value)}
                  />
                  <div className={styles.actionRow}>
                    <Button onClick={handleSaveThemeJson}>{copy.saveOverride}</Button>
                    <Button variant="secondary" onClick={handleThemeImport}>
                      <Upload className="h-4 w-4" />
                      {copy.importTheme}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const payload = exportThemeText(selectedTheme.id);
                        setThemeJson(payload);
                        downloadText(`${selectedTheme.id}.theme.json`, payload);
                      }}
                    >
                      <Download className="h-4 w-4" />
                      {copy.exportTheme}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        resetTheme(selectedTheme.id);
                        setStatus("Theme reset.");
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                      {copy.resetTheme}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>{copy.settings}</CardTitle>
                  <CardDescription>{copy.configJsonHint}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <ParentSettingsControls
                    capabilities={capabilities}
                    copy={copy}
                    onSettingsChange={updateSettings}
                    onThemeChange={setThemeId}
                    settings={settings}
                    themes={themes}
                  />
                  <Separator />
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="language-select">{copy.switchLanguage}</Label>
                      <Input
                        id="language-select"
                        readOnly
                        value={settings.language === "cs" ? "Čeština" : "English"}
                        onClick={() =>
                          updateSettings({
                            language: settings.language === "cs" ? "en" : "cs",
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="pin-input">{copy.pinProtection}</Label>
                      <div className={styles.pinRow}>
                        <Input
                          id="pin-input"
                          inputMode="numeric"
                          placeholder="0000"
                          type="password"
                          value={pinDraft}
                          onChange={(event) => setPinDraft(event.target.value)}
                        />
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            if (!pinDraft.trim()) {
                              setPinHash(null);
                              setStatus("PIN cleared.");
                              return;
                            }

                            setPinHash(await hashPin(pinDraft));
                            setPinDraft("");
                            setStatus("PIN saved.");
                          }}
                        >
                          {copy.apply}
                        </Button>
                      </div>
                    </div>
                    <Button variant="outline" onClick={resetSettings}>
                      {copy.reset}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="import-export">
              <Card>
                <CardHeader>
                  <CardTitle>{copy.importExport}</CardTitle>
                  <CardDescription>{copy.configJsonHint}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Textarea
                    className={styles.jsonArea}
                    placeholder={copy.configJsonHint}
                    value={configJson}
                    onChange={(event) => setConfigJson(event.target.value)}
                  />
                  <div className={styles.actionRow}>
                    <Button
                      onClick={() => {
                        const payload = exportConfigText();
                        setConfigJson(payload);
                        downloadText("bublbac.config.json", payload);
                      }}
                    >
                      <Download className="h-4 w-4" />
                      {copy.exportConfig}
                    </Button>
                    <Button variant="secondary" onClick={handleConfigImport}>
                      <Upload className="h-4 w-4" />
                      {copy.importConfig}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {status ? <p className={styles.status}>{status}</p> : null}
    </div>
  );
}

import { useRef, useState } from "react";
import { Home, MonitorCog, Rocket, Settings2, VolumeX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { ParentSettingsControls } from "@/components/shared/ParentSettingsControls";
import { PlaySurface } from "@/components/shared/PlaySurface";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { hashPin } from "@/lib/crypto";
import { PARENT_LONG_PRESS_MS } from "@/lib/play/parentUnlock";
import { useAppSession } from "@/providers/AppSessionProvider";
import styles from "@/styles/PlayPage.module.css";

export function PlayPage() {
  const navigate = useNavigate();
  const holdTimerRef = useRef<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const {
    activeTheme,
    audioSynth,
    capabilities,
    copy,
    fullscreenActive,
    leaveFullscreen,
    settings,
    setPinHash,
    setThemeId,
    themes,
    updateSettings,
  } = useAppSession();

  const requestParentPanel = () => {
    if (!settings.pinHash) {
      setPanelOpen(true);
      return;
    }

    setPinDialogOpen(true);
  };

  const clearHoldTimer = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const startCornerHold = () => {
    clearHoldTimer();
    holdTimerRef.current = window.setTimeout(() => {
      requestParentPanel();
    }, PARENT_LONG_PRESS_MS);
  };

  async function submitPin() {
    const hash = await hashPin(pinInput);
    if (hash !== settings.pinHash) {
      setPinError(copy.wrongPin);
      return;
    }

    setPinInput("");
    setPinError("");
    setPinDialogOpen(false);
    setPanelOpen(true);
  }

  return (
    <div className={styles.page}>
      <PlaySurface
        audioSynth={audioSynth}
        onParentSequence={requestParentPanel}
        settings={settings}
        theme={activeTheme}
      />

      <button
        type="button"
        data-testid="parent-hotspot"
        className={styles.cornerHotspot}
        aria-label={copy.parentPanelTitle}
        onPointerDown={startCornerHold}
        onPointerLeave={clearHoldTimer}
        onPointerUp={clearHoldTimer}
      />

      <div className={styles.hud}>
        <div className={styles.hudBadge}>
          <Rocket className="h-4 w-4" />
          <span>{activeTheme.labels.playHint[settings.language]}</span>
        </div>
        {!settings.soundEnabled ? (
          <div className={styles.hudPill}>
            <VolumeX className="h-4 w-4" />
            <span>{copy.muted}</span>
          </div>
        ) : null}
      </div>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{copy.parentPanelTitle}</SheetTitle>
            <SheetDescription>
              {activeTheme.labels.parentHint[settings.language]}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 grid gap-5">
            <ParentSettingsControls
              capabilities={capabilities}
              copy={copy}
              onSettingsChange={updateSettings}
              onThemeChange={setThemeId}
              settings={settings}
              themes={themes}
            />

            <div className="rounded-[24px] border border-border/60 bg-white/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <strong className="text-sm">{copy.pinProtection}</strong>
                  <p className="text-xs text-muted-foreground">
                    {settings.pinHash ? copy.unlockParent : copy.setPin}
                  </p>
                </div>
                {settings.pinHash ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPinHash(null)}
                  >
                    {copy.turnOffPin}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const pin = window.prompt(copy.setPin);
                      if (!pin) {
                        return;
                      }
                      setPinHash(await hashPin(pin));
                    }}
                  >
                    {copy.setPin}
                  </Button>
                )}
              </div>
              <Separator className="my-3" />
              <div className="grid gap-2">
                <Button asChild variant="secondary">
                  <Link to="/parent/studio">
                    <Settings2 className="h-4 w-4" />
                    {copy.openStudio}
                  </Link>
                </Button>
                {fullscreenActive ? (
                  <Button variant="outline" onClick={() => void leaveFullscreen()}>
                    <MonitorCog className="h-4 w-4" />
                    {copy.exitFullscreenTitle}
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() => {
                    setPanelOpen(false);
                    navigate("/");
                  }}
                >
                  <Home className="h-4 w-4" />
                  {copy.backHome}
                </Button>
              </div>
            </div>
          </div>
          <SheetFooter className="pt-6">
            <Button variant="ghost" onClick={() => setPanelOpen(false)}>
              {copy.close}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.unlockParent}</DialogTitle>
            <DialogDescription>{copy.enterPin}</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            inputMode="numeric"
            placeholder="0000"
            type="password"
            value={pinInput}
            onChange={(event) => {
              setPinInput(event.target.value);
              setPinError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void submitPin();
              }
            }}
          />
          {pinError ? <p className="text-sm text-destructive">{pinError}</p> : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPinDialogOpen(false)}>
              {copy.close}
            </Button>
            <Button onClick={() => void submitPin()}>{copy.apply}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

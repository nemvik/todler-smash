import { Info } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { BrowserCapabilities, ParentSettings, ThemePack } from "@/types/app";

interface ParentSettingsControlsProps {
  settings: ParentSettings;
  themes: ThemePack[];
  capabilities: BrowserCapabilities;
  copy: {
    themeSelect: string;
    soundEnabled: string;
    volume: string;
    intensity: string;
    burstCount: string;
    fadeSpeed: string;
    reduceMotion: string;
    idleMode: string;
    fullscreen: string;
    keyboardLock: string;
    wakeLock: string;
    unsupportedApi: string;
  };
  onSettingsChange: (next: Partial<ParentSettings>) => void;
  onThemeChange: (themeId: string) => void;
}

export function ParentSettingsControls({
  settings,
  themes,
  capabilities,
  copy,
  onSettingsChange,
  onThemeChange,
}: ParentSettingsControlsProps) {
  return (
    <TooltipProvider>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>{copy.themeSelect}</Label>
          <Select value={settings.themeId} onValueChange={onThemeChange}>
            <SelectTrigger aria-label={copy.themeSelect}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {themes.map((theme) => (
                <SelectItem key={theme.id} value={theme.id}>
                  {theme.icon} {theme.name[settings.language]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SwitchRow
          checked={settings.soundEnabled}
          label={copy.soundEnabled}
          onCheckedChange={(checked) => onSettingsChange({ soundEnabled: checked })}
        />
        <RangeRow
          label={copy.volume}
          value={Math.round(settings.volume * 100)}
          min={0}
          max={100}
          step={1}
          onValueChange={(value) => onSettingsChange({ volume: value / 100 })}
          disabled={!settings.soundEnabled}
        />
        <RangeRow
          label={copy.intensity}
          value={Math.round(settings.intensity * 100)}
          min={60}
          max={160}
          step={5}
          onValueChange={(value) => onSettingsChange({ intensity: value / 100 })}
        />
        <RangeRow
          label={copy.burstCount}
          value={settings.burstCount}
          min={1}
          max={6}
          step={1}
          suffix="x"
          onValueChange={(value) => onSettingsChange({ burstCount: value })}
        />
        <RangeRow
          label={copy.fadeSpeed}
          value={settings.fadeMs}
          min={1200}
          max={2200}
          step={100}
          suffix="ms"
          onValueChange={(value) => onSettingsChange({ fadeMs: value })}
        />

        <SwitchRow
          checked={settings.reduceMotion}
          label={copy.reduceMotion}
          onCheckedChange={(checked) => onSettingsChange({ reduceMotion: checked })}
        />
        <SwitchRow
          checked={settings.idleMode}
          label={copy.idleMode}
          onCheckedChange={(checked) => onSettingsChange({ idleMode: checked })}
        />
        <SwitchRow
          checked={settings.preferFullscreen}
          label={copy.fullscreen}
          onCheckedChange={(checked) =>
            onSettingsChange({ preferFullscreen: checked })
          }
        />
        <SwitchRow
          checked={settings.keyboardLockEnabled}
          label={copy.keyboardLock}
          disabled={!capabilities.keyboardLock}
          tooltip={!capabilities.keyboardLock ? copy.unsupportedApi : undefined}
          onCheckedChange={(checked) =>
            onSettingsChange({ keyboardLockEnabled: checked })
          }
        />
        <SwitchRow
          checked={settings.wakeLockEnabled}
          label={copy.wakeLock}
          disabled={!capabilities.wakeLock}
          tooltip={!capabilities.wakeLock ? copy.unsupportedApi : undefined}
          onCheckedChange={(checked) =>
            onSettingsChange({ wakeLockEnabled: checked })
          }
        />
      </div>
    </TooltipProvider>
  );
}

function SwitchRow({
  checked,
  disabled = false,
  label,
  tooltip,
  onCheckedChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  tooltip?: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-[22px] border border-border/60 bg-white/70 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{label}</span>
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="rounded-full p-1 text-muted-foreground"
                aria-label={tooltip}
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <Switch
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function RangeRow({
  label,
  value,
  min,
  max,
  step,
  disabled = false,
  suffix = "%",
  onValueChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  suffix?: string;
  onValueChange: (value: number) => void;
}) {
  return (
    <div className="rounded-[22px] border border-border/60 bg-white/70 px-4 py-3">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm font-medium">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        aria-label={label}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([nextValue]) => onValueChange(nextValue)}
      />
    </div>
  );
}

# BublBác!

`BublBác!` is a static toddler-safe smash toy web app built with React, TypeScript, and Vite. A parent opens the landing page, taps `Start play`, the app unlocks audio, attempts fullscreen, and the child can mash keyboard, mouse, or touch for soft visual + sound feedback.

## What ships in v1

- `/` parent-facing landing page with one-tap start, five theme cards, and short safety/help cards
- `/play` fullscreen or pseudo-fullscreen play mode with keyboard, mouse, pointer, click, and touch support
- `/parent/studio` local parent editor with theme preview, settings, JSON import/export, and reset flows
- 5 built-in editable theme packs
- Hidden parent controls in play mode
  - Long-press the top-left corner for 2 seconds
  - Or type `parent`
- Czech and English dictionaries, defaulting to Czech
- Local-only storage, no backend, no tracking, no third-party runtime requests during play

## Stack

- React 19
- TypeScript
- Vite
- React Router
- CSS Modules + CSS variables for the app visuals
- Tailwind + shadcn/ui primitives for parent-facing controls
- Web Audio API synth for original sound effects
- Canvas-based imperative play engine for performance
- Vitest + Playwright for verification

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm test
npm run test:e2e
```

## Local development

```bash
npm install
npm run dev
```

Open the printed local URL, then:

1. Pick a theme or leave the default.
2. Press `Spustit hraní`.
3. The app will try `requestFullscreen({ navigationUI: "hide" })`.
4. If fullscreen is rejected or unsupported, `/play` still fills the viewport with a fixed pseudo-fullscreen layout.

## Folder guide

```text
src/
  app/                  Router and persistent shell
  assets/illustrations/ Original local SVG assets
  components/shared/    Play surface, theme previews, parent controls
  components/ui/        shadcn-style UI primitives
  content/themes/       Editable JSON theme packs
  lib/                  Audio, fullscreen, storage, play engine, theme helpers
  pages/                Landing, Play, Parent Studio
  providers/            Shared app session / local state
  styles/               Global CSS + CSS Modules
  test/                 Vitest setup
tests/                  Playwright smoke test
```

## Editing themes without touching app logic

Built-in themes live in:

- `src/content/themes/abc.json`
- `src/content/themes/animals.json`
- `src/content/themes/space.json`
- `src/content/themes/underwater.json`
- `src/content/themes/emoji-party.json`

Each pack supports:

- `id`
- `name`
- `description`
- `icon`
- `palette`
- `background`
- `items`
- `assetRefs`
- `soundPack`
- `particleStyle`
- `specialKeys`
- `labels`
- `defaults`

### Recommended edit flow

1. Open `/parent/studio`.
2. Pick a theme in the preview rail.
3. Edit the raw JSON in the `Theme JSON` tab.
4. Press `Uložit úpravy`.
5. The override is saved to `localStorage`, not to app logic.

### Import/export formats

Theme pack export:

```json
{
  "kind": "theme-pack",
  "schemaVersion": 1,
  "theme": {}
}
```

Parent config export:

```json
{
  "kind": "parent-config",
  "schemaVersion": 1,
  "settings": {},
  "themeOverrides": {},
  "customThemes": []
}
```

## Parent controls

### Hidden controls in play mode

- Long-press the invisible top-left hotspot for 2 seconds
- Or type `parent`

### Parent settings

- Theme
- Sound on/off
- Volume
- Effect intensity
- Symbols per press
- Fade length
- Gentle animated background
- Reduced motion
- Idle mode
- Prefer fullscreen
- Optional keyboard lock
- Optional wake lock
- Optional PIN protection

### PIN storage

PIN is never stored in plain text. The app stores a local SHA-256 hash using `crypto.subtle`.

## Fullscreen and device notes

### iPhone / iPad

Safari may not allow true fullscreen for arbitrary pages. `BublBác!` falls back to a fixed pseudo-fullscreen layout that still fills the viewport and disables scrolling.

### Keyboard lock

If `navigator.keyboard.lock` exists and the parent enables it, the app requests it only as a progressive enhancement while fullscreen is active.

### Wake lock

If `navigator.wakeLock.request("screen")` exists and the parent enables it, the app requests it while fullscreen is active.

## Static deployment

The app is a plain SPA and builds to `dist/`.

### Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. The repo includes `public/_redirects` with `/* /index.html 200` for SPA routing.

### Cloudflare Pages

1. Framework preset: `Vite`
2. Build command: `npm run build`
3. Output directory: `dist`
4. SPA routing works because the app is client-routed and the build is static.

## Verification

Executed during implementation:

- `npm run lint`
- `npm run build`
- `npm test`
- `npm run test:e2e`

The Playwright smoke test covers:

- landing page start flow
- fullscreen attempt
- audio unlock path
- keyboard + mouse interaction feedback
- hidden parent panel access
- reduced motion toggle
- reaction fade-out through the deterministic engine hook

# CLAUDE.md

Guidance for AI assistants working in the **Timeless** repository.

## What this is

Timeless is a time-based website blocker. Users add sites to a blocklist with a
daily time window; during that window the site redirects to a blocked page with a
live countdown, and outside it the site loads normally. Everything is stored
locally in the browser — no accounts, no cloud sync, no telemetry.

## Repository layout

This is an npm monorepo wired together with `--prefix` scripts (there is **no**
workspaces config). Each package is installed and built independently.

```
package.json            Root scripts that delegate to each package
packages/
  extension/            Chrome extension (Manifest V3)
    manifest.config.ts  Manifest defined in TS via @crxjs defineManifest
    vite.config.ts      Vite + React + CRXJS plugin
    popup.html          Entry HTML for the toolbar popup
    blocked.html        Entry HTML for the block redirect page
    src/
      types.ts          BlockedSite interface (shared shape, hand-imported)
      popup/            Popup UI — add / toggle / pause / remove sites
      blocked/          Blocked page — site name + countdown timer
      background/
        service-worker.ts  Manages declarativeNetRequest rules
  website/              Marketing landing page (Vite + React, static)
    src/App.tsx         Single-page landing component
```

## Commands

Run from the repo root:

```bash
npm run dev:extension     # Extension dev build with HMR
npm run dev:website       # Landing page dev server
npm run build:extension   # → packages/extension/dist
npm run build:website     # → packages/website/dist
```

Dependencies are **not** installed at the root. Install per package before first
use:

```bash
npm --prefix packages/extension install
npm --prefix packages/website install
```

Each package also exposes `dev`, `build`, and `preview` scripts directly.

### Loading the extension in Chrome

1. `npm run build:extension` (or `dev:extension` for HMR)
2. Open `chrome://extensions`, enable **Developer Mode**
3. **Load unpacked** → select `packages/extension/dist`

> **Note:** There is no test runner, linter, or formatter configured. TypeScript
> `strict` mode (with `noUnusedLocals` / `noUnusedParameters`) is the only
> automated check, enforced during `vite build`. Don't claim tests pass — there
> are none. Verify changes by building and exercising the extension in Chrome.

## How blocking works

The whole mechanism lives in `src/background/service-worker.ts`:

1. Blocklist is read from `chrome.storage.local` under the key `blockedSites`
   (an array of `BlockedSite`).
2. `isSiteBlocked()` decides if a site is active right now based on the current
   time vs. its `startTime`/`endTime` window. Overnight windows (e.g. 22:00–06:00,
   where `start > end`) are handled explicitly. A site is skipped if disabled or
   if `pausedUntil` is in the future.
3. `updateBlockRules()` rebuilds **all** dynamic `declarativeNetRequest` rules
   from scratch each run — it removes every existing dynamic rule and re-adds
   rules only for currently-active blocks. Each rule redirects the
   `MAIN_FRAME` of `||hostname^` to `blocked.html?site=…&until=…`.
4. Rules are re-evaluated:
   - on service-worker start,
   - every minute via a `chrome.alarms` alarm named `update-block-rules`
     (this also clears expired `pausedUntil` values), and
   - immediately whenever `blockedSites` changes (`chrome.storage.onChanged`).

The blocked page (`src/blocked/App.tsx`) reads `site` and `until` from the URL
query string and renders a live `HH:MM:SS` countdown until the window ends.

## The `BlockedSite` model

Defined once in `packages/extension/src/types.ts` and imported by both the popup
and the service worker:

```ts
interface BlockedSite {
  id: string;          // Date.now().toString()
  hostname: string;    // normalized, no scheme/path/www
  startTime: string;   // "HH:MM" 24-hour
  endTime: string;     // "HH:MM" 24-hour
  enabled: boolean;
  pausedUntil?: number; // epoch ms; temporary pause expiry
}
```

There is no shared package — `types.ts` belongs to the extension and is imported
via relative paths. If the website ever needs this shape, copy it; don't try to
cross-import between packages.

## Conventions

- **Stack:** React 18 + TypeScript + Vite 7, Tailwind CSS v3 (utility classes
  only, no component library). Dark theme throughout using the `zinc` palette
  with `violet-600` as the accent.
- **State:** Popup uses local `useState` and persists via `saveSites()`, which
  writes to `chrome.storage.local` and updates React state together. Treat
  `chrome.storage.local` as the single source of truth; the service worker reacts
  to storage changes rather than receiving messages.
- **Hostname normalization:** `normalizeHostname()` in the popup strips scheme,
  path, and leading `www.`, and lowercases. Keep the validation regex
  (`/^[a-z0-9.-]+\.[a-z]{2,}$/`) in sync if you change input handling.
- **Anti-impulse UX:** Disabling a block is intentionally high-friction — a 30s
  cooldown ring (`COOLDOWN_SECONDS`) runs before the pause options (15m / 30m /
  keep on) appear. Re-enabling is instant. Preserve this friction asymmetry when
  touching the toggle logic.
- **Manifest:** Edit `manifest.config.ts`, not a static `manifest.json` — CRXJS
  generates the manifest at build time. New permissions go in the `permissions`
  array there. Current permissions: `tabs`, `storage`, `alarms`,
  `declarativeNetRequest`, plus `host_permissions: <all_urls>`.
- **New extension pages:** Add an HTML entry + a `src/<name>/main.tsx` mount
  point, and register it in the manifest (e.g. via `web_accessible_resources`)
  the same way `blocked.html` is.

## Git workflow

- Active development branch for this work: `claude/claude-md-docs-adlk7j`.
- Commit with clear messages; push with `git push -u origin <branch>`.
- Do **not** open pull requests unless explicitly asked.
- The repo's only history convention so far is short, descriptive commit
  subjects (see `git log`).

## Publishing

`npm run build:extension`, zip `packages/extension/dist`, upload at the Chrome
Developer Dashboard. License is MIT.

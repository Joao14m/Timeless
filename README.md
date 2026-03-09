# Timeless

A time-based website blocker. Block distracting sites during your focus hours. They automatically unblock when your work is done.

## How it works

1. Add any website to your blocklist (e.g. `youtube.com`, `twitter.com`)
2. Set a time window (e.g. 9:00 AM – 5:00 PM)
3. During those hours, navigating to the site redirects you to a blocked page with a live countdown
4. Outside those hours, the site loads normally

All rules are stored locally in your browser. No accounts, no cloud sync, no tracking.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Monorepo | npm with `--prefix` scripts |
| Extension | Vite + React + TypeScript + CRXJS Vite Plugin |
| Website | Vite + React + TypeScript |
| Styling | Tailwind CSS v3 (dark mode) |
| Blocking | Chrome `declarativeNetRequest` API |
| Storage | `chrome.storage.local` |

## Project structure

```
packages/
  extension/       Chrome extension (Manifest V3)
    src/
      popup/       Popup UI — add, toggle, remove blocked sites
      blocked/     Blocked page — shows site name + countdown timer
      background/  Service worker — manages declarativeNetRequest rules
  website/         Marketing landing page
```

## Getting started

Install dependencies for each package:

```bash
cd packages/extension && npm install
cd ../website && npm install
```

Run dev servers from the repo root:

```bash
npm run dev:extension    # Extension dev build with HMR
npm run dev:website      # Landing page on localhost
```

Production builds:

```bash
npm run build:extension  # → packages/extension/dist
npm run build:website    # → packages/website/dist
```

### Loading the extension in Chrome

1. Run `npm run dev:extension` (or `npm run build:extension` for production)
2. Open `chrome://extensions`
3. Enable **Developer Mode**
4. Click **Load unpacked** → select `packages/extension/dist`

## Extension permissions

| Permission | Why |
|------------|-----|
| `tabs` | Detect which sites you're visiting |
| `storage` | Persist your blocklist locally |
| `alarms` | Re-evaluate block rules every minute |
| `declarativeNetRequest` | Redirect blocked sites to the blocked page |
| `host_permissions: <all_urls>` | Apply blocking rules to any website |

## Publishing to Chrome Web Store

1. `npm run build:extension`
2. Zip the `packages/extension/dist` folder
3. Upload at the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Submit for review

## License

MIT

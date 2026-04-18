# No More Slop

Chrome/Brave extension that hard-blocks short-form and algorithmic-feed content so you stay on task. Set an intent at the start of a session; the extension removes the feeds and reminds you why you're here every time you try to slip back.

## What it blocks

| Platform | Behavior |
|---|---|
| **YouTube** | Strips Shorts shelves, Shorts tab on channels, Playables, `/shorts/*` and `/playables/*` URLs redirect to home. Shorts on channel pages (`/@user/shorts`) also blocked. |
| **Instagram** | Reels tab + nav removed. `/reels/*` redirects to home. Stories and posts untouched. |
| **TikTok** | Entire site blocked — redirects to Google with a toast. Bounces back to the previous page if possible. |
| **Snapchat** | Spotlight, Discover, and Stories nav icons removed. Spotlight/Discover URLs redirect. Chat, lenses, and Snapchat+ untouched. |
| **X (Twitter)** | `/home`, `/notifications`, `/i/bookmarks`, `/explore`, profile pages redirect to `/messages`. DMs, individual tweets, settings, search, and auth flows stay accessible. |
| **Reddit** | `/`, `/r/popular`, `/r/all` redirect. Individual subreddits and posts unaffected. |
| **Google Search** | Short-form video carousels hidden. YouTube Shorts links in results get rewritten to `/watch?v=` so you get the long-form player. TikTok and Instagram Reels results hidden. |

## Features

- **Focus sessions** — type an intent, or just "Block slop" with no task.
- **Break mode** — confirm + timer (5/10/15/30 min). Alarm fires a toast when it's over.
- **Strict mode** — locks platform toggles and requires typing "end" to confirm ending the session.
- **In-page toast notifications** — swipe-down pill at top of any page when you hit a block. Never uses OS notifications.
- **Dark mode** — toggle in the popup header; persisted.
- **Block counter** — session stats per focus block.
- **Keyboard shortcut** — `Alt+Shift+S` opens the popup.
- **Session summary on end** — duration, block count, intent recap.

## Development

Requires Node 18+.

```bash
npm install
npm run dev
```

`npm run dev` builds the extension in watch mode into `dist/`. To test:

1. Open `chrome://extensions` (or `brave://extensions`)
2. Toggle **Developer mode** on
3. Click **Load unpacked** and select the `dist/` folder
4. Accept the permissions prompt (host access to all websites is required for the cross-tab toast overlay)

### Production build

```bash
npm run build
```

### Regenerate toolbar icons

```bash
node scripts/gen-icon.cjs
```

Reads `public/icons/logo.svg` and writes PNGs at 16/48/128/256/512.

## Project layout

```
manifest.json              Extension manifest (MV3)
vite.config.ts             Vite + CRXJS config
public/icons/              Logo SVG + platform SVGs + toolbar PNGs
src/
  background.ts            Service worker — URL redirects, break alarms, toast injection
  shared/
    storage.ts             Session + toggle + break + theme state
    toast.ts               In-page toast, queued across redirects
    inject-toast.ts        Self-contained toast fn for chrome.scripting
    messages.ts            Random block-message variants
  content/
    youtube.ts             Shorts/Playables hide + blank + redirect
    instagram.ts           Reels hide + redirect
    tiktok.ts              Whole-site redirect
    snapchat.ts            Spotlight/Discover/Stories hide + redirect
    x.ts                   Feed blocking, only /messages + allowlist reachable
    reddit.ts              Home/popular/all redirect
    google.ts              SERP short-form hiding + rewriting
  popup/                   Intent, toggles, break, summary UI
  blocked/                 Rarely-used fallback block page
scripts/
  gen-icon.cjs             SVG → toolbar PNG pipeline
```

## License

MIT — see `LICENSE`.

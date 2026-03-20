# Interview Pacer — Chrome Extension

A side panel HUD that shows your live interview timer in the Chrome sidebar, visible on any tab (including Google Docs) without covering your content.

---

## Setup

### 1. Set your app URL

Open `config.js` and set `APP_URL` to match where the Interview Pacer app is running:

```js
// Local dev:
const APP_URL = 'localhost:5173';

// Deployed (Vercel):
const APP_URL = 'interview-pacer.vercel.app';
```

The extension finds the app tab by matching this string against open tab URLs.

### 2. Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer Mode** (toggle in the top right)
3. Click **"Load unpacked"**
4. Select this `chrome-extension/` folder
5. The Interview Pacer icon will appear in your Chrome toolbar

### 3. Use it during an interview

1. Open the Interview Pacer app and start a **live session**
2. Switch to any other tab (Google Docs, etc.)
3. Click the **Interview Pacer icon** in the Chrome toolbar
4. The side panel opens on the right edge of Chrome
5. Timer and pace update in real time — controls work from the panel

---

## What the HUD shows

- **Session label** — company name + template (e.g. "Google — Behavioral 30min")
- **Current section** — name, elapsed/budget timer, pace bar, pace badge
- **Total progress** — overall elapsed/budget bar and time
- **Section outline** — all sections with completed/active/upcoming state
- **Controls** — ← Prev | ⏸ Pause/▶ Resume | → Next

---

## How it works

- The app writes timer state to `localStorage` on every tick (`interview-pacer-live-state`)
- The extension background worker reads that key from the app tab every second
- The side panel reads from `chrome.storage.session` and re-renders every 500ms
- Controls write a command to `interview-pacer-command` in localStorage; the app processes and clears it within 500ms

---

## Verification checklist

- [ ] Start app in dev (`npm run dev`) or open deployed Vercel URL
- [ ] Begin a live session → confirm `interview-pacer-live-state` in DevTools → Application → Local Storage
- [ ] Load the extension (unpacked), open a Google Docs tab, click icon
- [ ] Side panel opens and shows current section + live timer
- [ ] Pause in the app → panel timer stops within 1 second
- [ ] Use panel controls → app responds within 500ms
- [ ] Exit live mode in app → panel shows "No active session"

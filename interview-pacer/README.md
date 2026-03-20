# Interview Pacer

A browser-based interview prep and real-time pacing tool. Before an interview, prep your notes section-by-section. During the interview, a persistent timer sidebar keeps you on pace — visible the whole time, even on other tabs via the Chrome extension.

**All data stays in your browser** — localStorage only, no backend, no account required.

---

## Features

- **Interview templates** — built-in templates for Behavioral (30min), Case Study (45min), Product Sense (45min), and System Design (45min). Create custom templates with your own sections and time allocations.
- **Session prep** — fill in notes and talking points per section in Markdown. Sessions are reusable playbooks, not per-interview clones.
- **Live timer sidebar** — enter a company name and go. Per-section countdown with pace indicator (on-pace / warning / over-time / move-on). Total progress bar. Keyboard controls.
- **Chrome extension** — side panel HUD that shows your live timer on any tab (e.g. Google Docs), so you can keep your notes open without losing the timer.

---

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Chrome Extension

See [`chrome-extension/README.md`](./chrome-extension/README.md) for setup instructions.

Short version:
1. Edit `chrome-extension/config.js` — set `APP_URL` to wherever the app is running
2. Go to `chrome://extensions` → Developer Mode → Load unpacked → select `chrome-extension/`
3. Start a live session in the app, then click the extension icon on any tab

---

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- State: React Context + localStorage (no backend)

---

## Keyboard Shortcuts (Live Mode)

| Key | Action |
|-----|--------|
| Space | Pause / Resume |
| → | Next section |
| ← | Previous section |
| Esc | Collapse active section |

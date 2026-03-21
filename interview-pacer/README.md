# Interview Pacer

A browser-based interview prep and real-time pacing tool with a Chrome side panel extension.

**All data stays in your browser** — localStorage only, no backend, no account required.

---

## The Problem

Technical and product interviews are time-boxed, and most people naturally over-talk one section and run out of time for others. By the end, the interviewer hasn't seen your full range — just the parts you naturally gravitate toward.

The classic fix — glancing at a clock — doesn't help much. You see that you're behind, but you don't know *which section* you're on, how much budget you had for it, or how far behind you are relative to your plan.

Interview Pacer solves this by giving you a persistent, section-level timer that's visible the entire time you're in an interview. Before you start, you map out your sections and time budgets. During the interview, a sidebar (or Chrome side panel) shows you exactly where you are, how you're pacing, and when to move on — without switching tabs or losing focus.

### What it enables

- **Show the full picture** — hit every section so the interviewer sees all the skills the role demands, not just the parts you over-talk
- **Signal senior presence** — pacing yourself shows self-awareness and command; running over signals the opposite
- **Keep your notes visible** — prep content is right there when you need it, not buried in a doc
- **Low setup friction** — a new session takes under 5 minutes; templates are reusable across companies

---

## Features

- **Interview templates** — built-in templates for Behavioral (30min), Case Study (45min), Product Sense (45min), and System Design (45min). Create custom templates with your own sections and time allocations.
- **Session prep** — fill in notes and talking points per section in Markdown. Sessions are reusable playbooks — content carries forward to every interview, only the company name changes.
- **Live timer sidebar** — per-section countdown with pace indicator (on-pace / warning / over-time / move-on), total progress bar, and keyboard controls. All sections expandable to show your notes inline.
- **Chrome extension** — side panel HUD that keeps the timer visible on any tab (e.g. Google Docs with your prep notes open), without covering your content.

---

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Chrome Extension Setup

> **Before loading the extension, you must set your app URL in `config.js`.**
> The extension won't find your app tab without it.

### Step 1 — Set your URL

Open `chrome-extension/config.js` and update `APP_URL`:

```js
// If running locally:
const APP_URL = 'localhost:5173';

// If deployed (e.g. Vercel):
const APP_URL = 'your-app.vercel.app';
```

This is how the extension finds the tab running Interview Pacer. It must match the URL in your browser's address bar.

### Step 2 — Load the extension

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer Mode** (toggle in the top right)
3. Click **"Load unpacked"**
4. Select the `chrome-extension/` folder from this project

### Step 3 — Use it

1. Open the app and start a live session
2. Switch to any other tab (Google Docs, etc.)
3. Click the **Interview Pacer icon** in the Chrome toolbar
4. The side panel opens on the right — timer and pace update in real time
5. Use the ← ⏸ → controls in the panel without switching back to the app

---

## How the Extension Works

The app writes live timer state to `localStorage` on every tick. The extension's background service worker reads that key from the app tab every second via `chrome.scripting.executeScript` and pushes updates to the side panel over a persistent port connection. The port also keeps the service worker alive (solving the MV3 service worker sleep problem).

---

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- State: React Context + localStorage (no backend)
- Extension: Chrome MV3, side panel API

---

## Keyboard Shortcuts (Live Mode)

| Key | Action |
|-----|--------|
| Space | Pause / Resume |
| → | Next section |
| ← | Previous section |
| Esc | Collapse / expand active section |

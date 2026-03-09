# Baby Nutrition Tracker — Project Goals

**Created:** 2026-02-27
**Status:** In progress

---

## Overview

A password-protected web app where a nanny can log what a baby/toddler eats throughout the day — by typing or voice dictation. The app keeps a running log and uses it to summarize nutrition, flag gaps, and recommend new foods.

---

## Success Metrics

### Primary
| Metric | Direction | What it measures |
|--------|-----------|-----------------|
| Food variety | ↑ | Fewer repeated foods week-over-week |
| Log latency | ↓ | Time between eating and logging — proxy for ease of use. *Requires feature: customizable meal time at entry.* |
| Daily nutrition score | ↑ | % of daily goals met across key nutrients |

### Secondary
- Nanny satisfaction (qualitative)
- Parent satisfaction (qualitative)

---

## Users

| User | Role | Tech comfort |
|------|------|--------------|
| Nanny | Logs meals daily | Low — Facebook/YouTube level |
| Parent | Reviews summaries, adjusts goals | Moderate |

---

## User Objectives

### Nanny
- **Confidence & clarity** — I can prep all of baby's meals in under 5 minutes, or asynchronously during nap time
- **Parent approval** — I have the parent's sign-off on what I feed their child
- **Safety confidence** — I'm confident in food safety, minimal choking risk, and zero allergy risk
- **Effortless tool** — The app is as easy to use as writing it down by hand

### Parent
- **Time back** — I'm no longer managing the nanny on snack selection
- **Picky eater prevention** — My child gets variety and I get new food ideas
- **Health assurance** — I know my child's nutritional needs are being met

---

## Core Features

### 1. Meal Logging (nanny-facing)
- Big, friendly input area — type or use phone mic to dictate
- Log: what was eaten + approximate amount + time
- Confirm with one tap — no complicated forms
- See today's log as a scrollable feed (like a Facebook timeline)
- Edit or delete entries easily

### 2. Nutrition Log & History
- View log by day (default: today)
- Browse past days
- Visual progress toward daily goals (colored bars — green/yellow/red)

### 3. Summaries (parent-facing)
- "Last 7 days" / "Last 30 days" summary
- What foods were eaten most
- Nutrients consistently low or high
- Easy-to-read card layout

### 4. Nutrition Gap Analysis
- Compare actual intake vs. age-appropriate daily goals
- Flag nutrients that are consistently under-served
- Tailored to child's known dietary restrictions

### 5. Food Recommendations
- Suggest specific foods to fill nutrient gaps
- Consider: texture (soft/mashed/finger food), exposure history, allergen status
- "Try this next" section on home screen

---

## UX Principles

- **Facebook/YouTube-level simplicity** — big buttons, large text, friendly icons
- **Mobile-first** — nanny will use her phone
- **Voice-friendly** — native browser speech-to-text on the input field
- **No training required** — self-explanatory at a glance
- **Forgiving** — fuzzy food matching, no strict formats required

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Next.js (React) | Vercel-native, great mobile UX |
| Backend / API | Next.js API routes | Keep it simple, same deploy |
| Database | Supabase (Postgres) | Free tier, real-time, easy auth |
| Auth | Supabase Auth (password) | Simple email+password for nanny |
| Nutrition data | USDA FoodData Central API | Free, comprehensive |
| Deployment | Vercel | Free tier, zero-config |
| Voice input | Web Speech API (browser-native) | No extra cost or service |

> **Note:** Initial prototype was Flask + SQLite. Next phase = migrate to Next.js + Supabase for Vercel deployment.

---

## Phase Feedback Structure

At the end of each phase, both Claude and the parent complete the same review independently, then compare.

### Dimensions

**1. Success Metric Impact**
- By how much does this version move each primary metric (food variety, log latency, nutrition score)?
- Which metric improved most? Which least?

**2. User Objectives Grade** *(A–F per objective)*
- Nanny: confidence & clarity / parent approval / safety confidence / tool ease
- Parent: time back / picky eater prevention / health assurance

**3. Site Performance**
- Observed latency (page load, food search, log submission)
- Any errors or broken flows encountered
- *Claude uses Chrome integration to assess this directly*

**4. UI/UX Grade** *(A–F overall + one strength, one weakness)*
- Mobile experience
- Clarity for a low-tech user

---

### How It Works
- Claude opens the deployed Vercel URL via Chrome, tests key flows (log a meal, view dashboard, check recommendations), reads console errors, and assesses mobile viewport
- Parent completes the same review from real usage on their phone
- We compare and use gaps to prioritize the next phase

---

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-27 | Use Next.js + Supabase over Flask + SQLite | Enables Vercel deploy, cloud DB, built-in auth |
| 2026-02-27 | Mobile-first, Facebook-style UX | Nanny is tech-casual, uses phone |
| 2026-02-27 | Web Speech API for dictation | Browser-native, no extra cost |

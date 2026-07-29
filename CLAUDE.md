# open-projects

This is a **public GitHub repo** (`github.com/elzbstark/open-projects`). Everything here is visible to anyone.

## Anonymization (non-negotiable)

Before touching any file in this directory, ask: could this contain personal information?

- No real names (family members, contacts, employers)
- No personal email addresses, phone numbers, or location data
- No identifying details about personal life, health, or family
- No private API keys, tokens, or credentials — use env vars or `.env.example` patterns
- Placeholder names in examples: use generic ones (e.g. "Alex", "the user", "example@email.com")

**When in doubt, ask before committing.**

## Pushing

Never push to this repo without explicit approval. Always confirm: "Ready to push to **public** open-projects repo?" and wait for yes.

## Projects in this repo

- `interview-pacer/` — Vite + TypeScript, deployed to Vercel. Four things here are **local-only, never commit them**: `feedback/`, `PROJECT_GOALS.md`, `ROADMAP.md`, `ui-playgrounds/`. All four are in `.gitignore`. They moved here from a second directory in the private repo on 2026-07-28; keeping the planning docs next to the code means `/site-review` and `/build-phase` find them. Before that, a 2026-04-02 review graded the app against goals guessed from the README because `PROJECT_GOALS.md` was in the other copy.
- `satc-quiz/` — Static HTML/JS/CSS, deployed to satc-rewatch.vercel.app (Vercel root dir: `satc-quiz`). No build step. SATC episode recommender quiz.
- `morning-brief/` — showcase copy only. The live version runs from the private repo. Update manually when the private version has significant changes worth showing; always diff for personal info before committing.
- `baby-nutrition-tracker/` — stub/reference only; full app lives in private repo.

## Design preferences

Liz has strong visual taste. Don't default to safe/generic aesthetics.

- **Commit to a real reference point** — a specific magazine, era, or brand — not a vague mood like "elegant" or "modern."
- **Avoid flowery serifs** (Cormorant Garamond) and generic AI slop (Inter, purple gradients, dark mode + gold accents).
- **Push past the first idea.** If the design could be any project's landing page, it's not done yet. Ask: would someone screenshot this?
- **Examples of directions that land:** 1999 Vogue editorial (Bodoni Moda, Space Mono, fuchsia on cream), brutalist, maximalist print — anything with a clear point of view.

## Vercel deploys

`interview-pacer` deploys automatically on push to `main`. Confirm intent before pushing if changes are experimental.

## morning-brief sync checklist

When syncing `morning-brief/` from the private version:
1. Diff the two `morning-brief.py` files — copy the private version over
2. Replace hardcoded personal paths with `Path.cwd()` or env var defaults
3. Replace any personal email addresses with `your-email@gmail.com` placeholders
4. Replace personal task list names (e.g. "Liz's list") with generic ones (e.g. "My list")
5. Verify `Context/goals.md` and `Context/preferences.md` contain only placeholder template content — not real personal data
6. Confirm no personal info before committing

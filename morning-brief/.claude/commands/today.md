# Today Skill

| name | description |
|------|-------------|
| today | Goal-oriented daily brief: calendar, throughput-capped task list assigned to work blocks, podcast pick. Writes output to daily-brief.md. Use when you want to start your day. |

## Purpose

Generate a personalized daily brief each morning. Reads your goals and preferences, selects tasks across your goal categories (capped by your realistic throughput), assigns each task to a named work block, recommends a podcast episode matched to how busy your day is, and writes everything to a local file.

## Instructions

### 1. Get Today's Date and Time Bounds

From the system context (`currentDate`), construct Pacific time bounds:
- `time_min` = `YYYY-MM-DDT00:00:00-08:00`
- `time_max` = `YYYY-MM-DDT23:59:59-08:00`
- `completed_min` = 7 days before `currentDate` in the same format: `YYYY-MM-DDT00:00:00-08:00`
- `yesterday` = 1 day before `currentDate`

### 2. Fetch Everything in Parallel

Run ALL of these simultaneously in one batch:

**Calendar & context:**
- **Calendar:** `get_events` — `user_google_email: YOUR_EMAIL@gmail.com`, `calendar_id: primary`, `time_min`, `time_max`, `detailed: true`, `max_results: 50`
- **Task lists:** `list_task_lists` — `user_google_email: YOUR_EMAIL@gmail.com`
- **Goals:** Read `Context/goals.md` — graceful if missing
- **Preferences:** Read `Context/preferences.md` — graceful if missing
- **Throughput file:** Read `Context/throughput.json` — graceful if missing, treat as first run
- **Spotify episodes:** `get_saved_episodes` — `limit: 50` — if Spotify MCP is unavailable or the call errors, continue without it; set `spotify_available = false`

After `list_task_lists` returns, fetch all task lists in parallel (two calls per list, run all simultaneously):
- **Open tasks** per list: `list_tasks` — `show_completed: false`, `show_hidden: true`, `max_results: 100`
- **Completed tasks** per list (for throughput): `list_tasks` — `show_completed: true`, `show_hidden: true`, `completed_min: [7 days ago]`, `max_results: 200`

**Validation:** If `goals.md` or `preferences.md` is missing or contains only template placeholder text (lines starting with `- [e.g.,`), print a warning at the top of the brief and proceed with reduced output for that section.

### 2.5. Compute Throughput

After all fetches return:

1. Collect all completed tasks from every list. Use the `updated` field as the proxy for completion date (it reflects when the task was last modified, which aligns with completion).
2. For each of the past 7 calendar days (including today), count how many tasks have an `updated` date matching that day. Days with zero completions count as 0.
3. Rolling 7-day average = total completions across all 7 days ÷ 7 (always divide by 7, even if some days are zero).
4. Derive task cap: `max(3, min(7, round(avg) + 1))` — gives a small stretch over average, floor of 3, ceiling of 7.
5. Read existing `throughput.json` if present. Merge new daily counts into `daily_counts` (new days overwrite old entries for the same date). Prune any entries older than 30 days.
6. Write updated `Context/throughput.json`:

```json
{
  "last_updated": "YYYY-MM-DD",
  "daily_counts": {
    "YYYY-MM-DD": N,
    ...
  },
  "rolling_7day_avg": 3.1,
  "recommended_task_cap": 4
}
```

**First run (no throughput.json):** use `recommended_task_cap = 5` for this run, then write the file after computing from today's data.

**Yesterday's completions:** From the completed tasks, collect all tasks whose `updated` date equals `yesterday`. Store these as `yesterday_wins` (task titles, most recently updated first, max 3). Used in output.

### 3. Assess Day Busyness and Compute Work Blocks

**Busyness:**
- Sum the duration of all calendar events.
- **Busy day:** total meeting time ≥ 3 hours
- **Open day:** total meeting time < 3 hours

**Work blocks — infer from preferences.md:**

Read the Day Structure section of `preferences.md` and derive named blocks. If no Day Structure is defined, fall back to these defaults:

| Block | Default Window | Character |
|-------|---------------|-----------|
| Morning | Start of day–noon | Deep focus, creative, high-effort work |
| Lunch | 12:00–1:00 PM | Break — not assigned tasks |
| Afternoon | 1:00–5:00 PM | Meetings, admin, errands, lighter work |
| Evening | After 6:00 PM | Light tasks, planning, reading, chores |

If the user's preferences describe different block names or windows, use those instead.

**Trim by calendar events:** For each named block, find any calendar events that overlap. Subtract that time from the block's available minutes. If a block is entirely consumed by meetings, mark it "unavailable." Compute the actual available duration per block (in hours and minutes).

Example: If a dentist appointment runs 9:00–10:30 AM, the Morning block has reduced capacity for the remaining time.

### 4. Select Tasks Using Throughput Cap

Use `recommended_task_cap` from throughput.json (or 5 on first run) as the maximum task count.

**Derive categories from goals.md.** Read the top-level sections of `goals.md` (e.g., Career, Personal, Health, Learning, Projects) and use those as your task categories. If `goals.md` is missing, fall back to: Work, Personal, Projects.

**Require a mix across categories** (no more than 3 from any single category).

**Prioritization order within each category:**
1. Due today
2. Due within 3 days (boost these)
3. Goal-aligned (matches something in `goals.md`)
4. Everything else

**Apply preferences rules** from `preferences.md`:
- Honor any "no more than N tasks of type X per day" rules
- Always include ≥ 1 personal task if any personal tasks exist
- Respect any work style or day structure guidance when choosing

**After selecting tasks, assign each to a work block** using the task-nature → block mapping:

| Task type | Preferred block | Fallback |
|-----------|----------------|---------|
| Deep focus (writing, coding, research, creative work) | Morning | Afternoon |
| Quick admin (emails, scheduling, small to-dos) | Morning (start) | Afternoon |
| Physical / out-of-house (errands, appointments, exercise) | Afternoon | Morning |
| Financial / paperwork (bills, forms, admin) | Afternoon | Evening |
| Light work (reading, planning, easy tasks, chores) | Evening | Afternoon |

If a block is "unavailable" (fully consumed by meetings), overflow all its tasks to the best fallback block. If multiple tasks are assigned to the same block and the combined estimated time exceeds available minutes, overflow the lowest-priority task to the next best block.

Skip completed tasks.

**Determine Today's Focus:** The single most important task — due-today tasks first, then top task by priority across all categories. Compose a one-phrase explanation of why it matters most today.

**Goal-aligned suggestions:** After selecting tasks, check which goal areas from `goals.md` are NOT covered by selected tasks. For uncovered areas, generate 1–2 small, concrete actions (≤30 min each) that Claude proposes — not from Google Tasks. Rules:
- Max 2 suggestions total
- Must be small and concrete (e.g. "Text one friend you haven't spoken to in a month")
- Do not suggest anything already on your open task list
- If all goal areas are well covered by selected tasks, set `also_consider = []` (omit section)

### 5. Pick a Podcast Episode

If `spotify_available = false` (Spotify errored or timed out), skip this step entirely — set `podcast_pick = null`.

Otherwise, from the saved episodes returned by `get_saved_episodes`:
- Read podcast preferences from `preferences.md` if defined there; use those to guide selection
- **Busy day (default):** prefer episodes that feel lighter — storytelling, culture, interviews, narrative
- **Open day (default):** prefer episodes that feel productive — ideas, skills, industry topics, long-form thinking
- Pick the single best match. If no good match exists, pick the most recently saved episode.

### 6. Build Output

Assemble the brief using the format below, then:
1. Print it to the Claude conversation
2. Write (overwrite) to: `daily-brief.md`

## Output Format

```
## Daily Brief — [Weekday, Month Day, Year]

**Today's focus:** [task name] — [one phrase why it matters most today]

**Yesterday:** Completed N tasks — [task 1], [task 2], [task 3]
(omit this line entirely if no tasks completed yesterday)

### Today's Tasks (N/M) — avg N.N/day
(N = tasks selected, M = recommended cap, N.N = rolling_7day_avg from throughput.json)
(omit "— avg N.N/day" portion on first run when no throughput.json existed)

#### [Category from goals.md]
1. **[Task name]** [Morning] — reason
2. **[Task name]** [Morning] — reason

#### [Category from goals.md]
3. **[Task name]** [Afternoon] — reason

#### [Category from goals.md]
4. **[Task name]** [Evening] — reason

(Only show categories that have at least one task assigned.)
(The [Block] tag in brackets is the assigned work block for that task.)

💡 **Also consider:** [small goal-aligned action] · [small goal-aligned action]
(omit this line entirely if all goal areas are already covered by selected tasks)

### Schedule
- HH:MM–HH:MM  [Event name]
- HH:MM–HH:MM  [Event name]
Free blocks: HH:MM–HH:MM (N hr), HH:MM onward (open)
(or "No meetings today" if calendar is empty)

### Reminders
- [Standing reminders from preferences.md]
(omit section if no reminders)

### Expected Progress Toward Goals
- [Category]: [1 sentence on how today's tasks in this category move this goal forward]
- [Category]: [1 sentence on how today's tasks in this category move this goal forward]
(one line per category that has tasks selected; omit categories with no tasks or only placeholder text in goals.md)

### Podcast Pick
**[Episode title]** — [Show name] · [duration]
[1-sentence reason tied to busy/open day]
(omit entire section if spotify_available = false — no placeholder, no error message)
```

## Inputs
- `currentDate` from system context (required)
- Google Calendar — primary calendar (YOUR_EMAIL@gmail.com)
- Google Tasks — all lists (YOUR_EMAIL@gmail.com)
- `Context/goals.md` (optional — degrades gracefully if missing)
- `Context/preferences.md` (optional — degrades gracefully if missing)
- `Context/throughput.json` (optional — created on first run)
- Spotify saved episodes via `get_saved_episodes` (optional — skipped if MCP unavailable)

## Sources
- Google Calendar MCP (`google-workspace-lz`)
- Google Tasks MCP (`google-workspace-lz`)
- Spotify MCP (`spotify`)
- Local files: `Context/goals.md`, `Context/preferences.md`, `Context/throughput.json`

## Output
- Brief printed to Claude conversation
- `daily-brief.md` written/overwritten at project root
- `Context/throughput.json` written/updated each run

## Notes
- All times in PST (Pacific Standard Time, UTC-8 or UTC-7 during daylight saving)
- Task count must be ≤ recommended_task_cap (never hardcoded 7)
- Identify free blocks between calendar events (≥ 30 min) and call them out in the Schedule section
- Keep task reasoning concise (one short phrase, not a paragraph)
- Work block assignment is best-effort; if task nature is ambiguous, use judgment based on the task name

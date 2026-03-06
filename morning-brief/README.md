# Personal AI Daily Brief System

An AI-powered morning brief that runs automatically every day, pulling from Google Calendar, Google Tasks, and Spotify to generate a personalized, prioritized plan for the day — then emails it to you.

## How It Works

```
GitHub Actions (7 AM cron)
        │
        ▼
automation/morning-brief.py
        │
        ▼
claude -p "/today"   ←── .claude/commands/today.md (the skill)
        │
        ├── Google Calendar MCP   → today's events + free blocks
        ├── Google Tasks MCP      → open tasks across all lists
        ├── Spotify MCP           → saved podcast episodes
        └── Context/ files        → goals, preferences
        │
        ▼
daily-brief.md  (written to project root)
        │
        ▼
Gmail (SMTP) → email sent to you
```

The core logic lives in [`.claude/commands/today.md`](.claude/commands/today.md) — a Claude skill that:

1. Fetches your calendar, tasks, and Spotify episodes in parallel
2. Computes your rolling task throughput and sets a realistic cap for the day
3. Selects a balanced task mix (career, personal, projects) and assigns each to a named work block
4. Picks a podcast episode matched to how busy your day is
5. Writes a formatted brief and emails it to you

## Setup

### 1. Fork and clone this repo

### 2. Configure MCP servers

Copy `.mcp.github.json` and fill in your credentials:

```json
{
  "SPOTIFY_CLIENT_ID": "your-client-id",
  "SPOTIFY_CLIENT_SECRET": "your-client-secret",
  "GOOGLE_OAUTH_CLIENT_ID": "your-google-client-id",
  "GOOGLE_OAUTH_CLIENT_SECRET": "your-google-client-secret",
  "USER_GOOGLE_EMAIL": "you@gmail.com"
}
```

- **Spotify:** Create an app at [developer.spotify.com](https://developer.spotify.com). Set redirect URI to `http://127.0.0.1:8888/callback`.
- **Google:** Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com). Enable Calendar and Tasks APIs. Use [workspace-mcp](https://github.com/MarkusPfundstein/workspace-mcp) for the MCP server.

### 3. Add GitHub Actions secrets

| Secret | Description |
|--------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `GOOGLE_OAUTH_TOKEN` | Contents of your Google OAuth token JSON file |
| `SPOTIFY_CACHE` | Contents of your Spotify `.cache` file (after first local auth) |
| `GMAIL_APP_PASSWORD` | Gmail app password for sending email |

### 4. Update email addresses

In `.github/workflows/morning-brief.yml`, replace `your-email@gmail.com` with your actual email.

In `automation/refresh-google-token.py`, update the `CREDS_PATH` filename to match your email.

### 5. Fill in your context files

- `Context/goals.md` — your goals and long-term vision
- `Context/preferences.md` — your work style, day structure, and task preferences

### 6. Test locally

```bash
# Install dependencies
pip install spotipy "mcp[cli]"
npm install -g @anthropic-ai/claude-code

# Set up .env
echo "GMAIL_APP_PASSWORD=your-app-password" > automation/.env
echo "SEND_FROM=you@gmail.com" >> automation/.env
echo "SEND_TO=you@gmail.com" >> automation/.env

# Run the brief
python automation/morning-brief.py
```

### 7. Enable the GitHub Action

The workflow runs daily at 7 AM PST. You can also trigger it manually from the Actions tab.

## Project Structure

```
.
├── .claude/
│   └── commands/
│       └── today.md          # The core Claude skill
├── .github/
│   └── workflows/
│       └── morning-brief.yml # GitHub Actions workflow
├── automation/
│   ├── morning-brief.py      # Runs the skill and emails the result
│   └── refresh-google-token.py  # Refreshes OAuth token before each run
├── spotify-mcp/
│   ├── server.py             # Custom Spotify MCP server
│   └── requirements.txt
├── Context/
│   ├── goals.md              # Your goals (fill in)
│   ├── preferences.md        # Your preferences (fill in)
│   └── throughput.json       # Auto-updated task throughput tracker
└── .mcp.github.json          # MCP server config for GitHub Actions
```

## Key Design Decisions

**Throughput-capped tasks:** Rather than overwhelming you with a long task list, the system tracks how many tasks you actually complete per day (rolling 7-day average) and caps the daily recommendation at `avg + 1`, with a floor of 3 and ceiling of 7.

**Work block assignment:** Tasks are assigned to named time blocks (Pre-work, Focus A, Focus B, Evening) based on task type, then trimmed by your actual calendar events so the plan reflects reality.

**Graceful degradation:** If Spotify is unavailable, the podcast section is silently omitted. If context files are missing, the brief still runs with reduced output.

**`--dangerously-skip-permissions`:** The Claude CLI is run with this flag in CI (`automation/morning-brief.py`). This is intentional — in a headless GitHub Actions environment there is no user present to approve tool calls interactively, so the flag allows the skill to read files and call MCP tools without prompting. The workflow only has access to the secrets you explicitly configure, and the Claude skill is read-only (no writes except `daily-brief.md` and `throughput.json`). Do not use this flag in interactive local sessions.

**Self-updating throughput:** After each run, `Context/throughput.json` is committed back to the repo by GitHub Actions, so your task cap stays calibrated over time.

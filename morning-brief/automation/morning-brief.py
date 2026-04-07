"""
morning-brief.py v2 — pre-fetches Google data directly, calls Claude via Anthropic SDK.
Replaces the broken claude -p subprocess approach that hung indefinitely on MCP init.
"""

import json
import os
import platform
import re
import smtplib
import sys
import time
import traceback
from datetime import datetime, timezone, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

import markdown as md_lib

# ── Config ────────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(os.environ.get("PROJECT_ROOT", Path.cwd()))
BRIEF_PATH = PROJECT_ROOT / "daily-brief.md"
LOG_PATH = PROJECT_ROOT / "automation" / "brief.log"
ENV_PATH = PROJECT_ROOT / "automation" / ".env"
CREDS_PATH = Path(os.environ.get(
    "GOOGLE_CREDS_PATH",
    str(Path.home() / ".google_workspace_mcp" / "credentials" / "your-email@gmail.com.json"),
))
TODAY_SKILL_PATH = PROJECT_ROOT / ".claude" / "commands" / "today.md"

RAW_RESPONSE_PATH = PROJECT_ROOT / "automation" / "last-claude-response.txt"
RAW_PATTERNS_PATH = PROJECT_ROOT / "automation" / "last-patterns-response.txt"

CONTEXT_DIR = PROJECT_ROOT / "Context"
THROUGHPUT_PATH = CONTEXT_DIR / "throughput.json"
TASK_PATTERNS_PATH = CONTEXT_DIR / "task-patterns.json"
GOALS_PATH = CONTEXT_DIR / "goals.md"
PREFERENCES_PATH = CONTEXT_DIR / "preferences.md"
FEEDBACK_PATH = CONTEXT_DIR / "today-feedback.md"

# ── Helpers ───────────────────────────────────────────────────────────────────

def load_env():
    """Load key=value pairs from automation/.env into os.environ."""
    if not ENV_PATH.exists():
        raise FileNotFoundError(f".env not found at {ENV_PATH}")
    for line in ENV_PATH.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())


def log(msg: str):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{ts}] {msg}"
    print(entry, flush=True)
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(entry + "\n")


def format_schedule_html(markdown_text: str) -> str:
    """Replace the Schedule section bullet list with styled HTML event rows."""
    schedule_re = re.compile(r'(### Schedule\n)(.*?)(?=\n###|\Z)', re.DOTALL)

    def build_table(match):
        header = match.group(1)
        content = match.group(2).strip()
        rows = []
        for line in content.split('\n'):
            line = line.strip()
            if not line:
                continue
            event_match = re.match(r'-\s+(\d{1,2}:\d{2}[–\-]\d{1,2}:\d{2})\s+(.*)', line)
            if event_match:
                time_str = event_match.group(1)
                name = event_match.group(2).strip()
                is_free = re.match(r'_\(free\)_|_\(open\)_', name, re.IGNORECASE)
                if is_free:
                    label = 'free' if 'free' in name.lower() else 'open'
                    rows.append(
                        f'<tr>'
                        f'<td style="border-left:4px solid #34a853;padding:6px 12px;'
                        f'font-weight:bold;color:#2d7a3a;white-space:nowrap;width:130px">'
                        f'{time_str}</td>'
                        f'<td style="padding:6px 12px;color:#2d7a3a;font-style:italic">{label}</td>'
                        f'</tr>'
                    )
                else:
                    rows.append(
                        f'<tr>'
                        f'<td style="border-left:4px solid #4a90d9;padding:6px 12px;'
                        f'font-weight:bold;color:#444;white-space:nowrap;width:130px">'
                        f'{time_str}</td>'
                        f'<td style="padding:6px 12px">{name}</td>'
                        f'</tr>'
                    )
            elif re.match(r'No meetings', line, re.IGNORECASE):
                rows.append(
                    f'<tr><td colspan="2" style="border-left:4px solid #34a853;'
                    f'padding:6px 12px;color:#2d7a3a;font-style:italic">{line}</td></tr>'
                )
            else:
                rows.append(
                    f'<tr><td colspan="2" style="padding:4px 12px">{line}</td></tr>'
                )
        table = (
            '<table style="width:100%;border-collapse:collapse;margin:8px 0">\n'
            + '\n'.join(rows)
            + '\n</table>'
        )
        return header + table

    return schedule_re.sub(build_table, markdown_text)


def send_email(subject: str, body: str):
    app_password = os.environ["GMAIL_APP_PASSWORD"]
    send_from = os.environ["SEND_FROM"]
    send_to = os.environ["SEND_TO"]

    processed = format_schedule_html(body)
    html_body = md_lib.markdown(processed, extensions=["extra"])
    html = (
        '<html><body style="font-family:Arial,sans-serif;max-width:640px;'
        'margin:auto;color:#222;line-height:1.5">\n'
        + html_body
        + '\n</body></html>'
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = send_from
    msg["To"] = send_to
    msg.attach(MIMEText(body, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.login(send_from, app_password)
        smtp.sendmail(send_from, [send_to], msg.as_string())


def fail(subject: str, msg: str, send_error_email: bool = True):
    """Log a fatal error, optionally send error email, and exit."""
    tb = traceback.format_exc()
    full_msg = msg if tb.strip() == "NoneType: None" else f"{msg}\n\nTraceback:\n{tb}"
    log(f"FATAL: {full_msg}")
    if send_error_email:
        try:
            send_email(f"[ERROR] {subject}", f"Morning brief failed:\n\n{full_msg}")
        except Exception as e:
            log(f"Also failed to send error email: {e}")
    sys.exit(1)


# ── Google API ────────────────────────────────────────────────────────────────

def load_google_credentials():
    """Load Google OAuth credentials from the workspace-mcp credentials file."""
    from google.oauth2.credentials import Credentials

    if not CREDS_PATH.exists():
        raise FileNotFoundError(f"Google credentials not found at {CREDS_PATH}")

    cred_data = json.loads(CREDS_PATH.read_text())
    for required in ("client_id", "client_secret", "refresh_token"):
        if not cred_data.get(required):
            raise ValueError(f"Credentials file missing required field: {required}")

    return Credentials(
        token=cred_data.get("token"),
        refresh_token=cred_data["refresh_token"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=cred_data["client_id"],
        client_secret=cred_data["client_secret"],
    )


def fetch_calendar_events(creds, date: datetime) -> list:
    """Fetch today's events from Google Calendar."""
    from googleapiclient.discovery import build

    service = build("calendar", "v3", credentials=creds, cache_discovery=False)

    # Fetch a 24-hour window starting at midnight UTC of today
    day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)

    result = service.events().list(
        calendarId="primary",
        timeMin=day_start.isoformat(),
        timeMax=day_end.isoformat(),
        singleEvents=True,
        orderBy="startTime",
        maxResults=50,
    ).execute()

    events = []
    for e in result.get("items", []):
        start = e.get("start", {})
        end = e.get("end", {})
        events.append({
            "summary": e.get("summary", "(no title)"),
            "start": start.get("dateTime") or start.get("date"),
            "end": end.get("dateTime") or end.get("date"),
            "location": e.get("location"),
            "description": (e.get("description") or "")[:200],
            "status": e.get("status"),
        })
    return events


def fetch_tasks(creds, today_dt: datetime) -> tuple:
    """Fetch all task lists and return (open_tasks, completed_recent).

    open_tasks: {list_name: [task]} — needsAction only
    completed_recent: {list_name: [task]} — completed within last 7 days
    """
    from googleapiclient.discovery import build

    service = build("tasks", "v1", credentials=creds, cache_discovery=False)
    cutoff = (today_dt - timedelta(days=7)).strftime("%Y-%m-%d")

    lists_result = service.tasklists().list(maxResults=20).execute()
    open_tasks = {}
    completed_recent = {}

    for tl in lists_result.get("items", []):
        tasks_result = service.tasks().list(
            tasklist=tl["id"],
            showCompleted=True,
            showHidden=True,
            maxResults=100,
        ).execute()

        open_list = []
        completed_list = []
        for t in tasks_result.get("items", []):
            task = {
                "id": t.get("id"),
                "title": t.get("title", "(no title)"),
                "status": t.get("status"),
                "due": t.get("due"),
                "notes": (t.get("notes") or "")[:200],
                "completed": t.get("completed"),
                "parent": t.get("parent"),
            }
            if task["status"] == "needsAction":
                open_list.append(task)
            elif task["completed"] and task["completed"][:10] >= cutoff:
                completed_list.append(task)

        open_tasks[tl["title"]] = open_list
        completed_recent[tl["title"]] = completed_list

    return open_tasks, completed_recent


def compute_throughput(completed_recent: dict, existing: dict, today_dt: datetime) -> dict:
    """Count completions per day and compute rolling 7-day avg + task cap."""
    daily_counts = {}
    for tasks in completed_recent.values():
        for t in tasks:
            ts = t.get("completed")
            if not ts:
                continue
            day = ts[:10]  # YYYY-MM-DD
            daily_counts[day] = daily_counts.get(day, 0) + 1

    # Merge with existing counts (new days overwrite same-date entries)
    merged = dict(existing.get("daily_counts", {}))
    merged.update(daily_counts)

    # Prune entries older than 30 days
    cutoff_30 = (today_dt - timedelta(days=30)).strftime("%Y-%m-%d")
    merged = {k: v for k, v in merged.items() if k >= cutoff_30}

    # Rolling 7-day avg: sum last 7 days / 7 (days with no completions count as 0)
    last_7_total = sum(
        merged.get((today_dt - timedelta(days=i)).strftime("%Y-%m-%d"), 0)
        for i in range(7)
    )
    rolling_avg = last_7_total / 7
    cap = max(3, min(7, round(rolling_avg) + 1))

    return {
        "last_updated": today_dt.strftime("%Y-%m-%d"),
        "daily_counts": merged,
        "rolling_7day_avg": round(rolling_avg, 1),
        "recommended_task_cap": cap,
    }


# ── Prompt Building ───────────────────────────────────────────────────────────

def read_context_file(path: Path, label: str) -> tuple:
    """Return (content_str, exists_bool) for a context file."""
    if path.exists():
        return path.read_text(encoding="utf-8"), True
    return f"[{label} does not exist yet]", False


def build_prompt(
    date_str: str,
    calendar_events: list,
    open_tasks: dict,
    completed_recent: dict,
    throughput_summary: dict,
) -> str:
    """Build the full user prompt: pre-fetched data + today.md instructions + output format."""
    skill_content = TODAY_SKILL_PATH.read_text(encoding="utf-8")

    task_patterns_content, patterns_exists = read_context_file(TASK_PATTERNS_PATH, "task-patterns.json")
    goals_content, _ = read_context_file(GOALS_PATH, "goals.md")
    preferences_content, _ = read_context_file(PREFERENCES_PATH, "preferences.md")
    feedback_content, _ = read_context_file(FEEDBACK_PATH, "today-feedback.md")

    patterns_note = "" if patterns_exists else "\n(Does not exist yet — bootstrap it this run.)\n"

    return f"""## PRE-FETCHED DATA — {date_str}

All external data has been pre-fetched. Do NOT make any API calls or tool calls. Use only the data provided below.

### Google Calendar Events (today)
```json
{json.dumps(calendar_events, indent=2)}
```

### Open Tasks (all lists — needsAction only)
```json
{json.dumps(open_tasks, indent=2)}
```

### Recently Completed Tasks (last 7 days — for yesterday's wins and task patterns)
```json
{json.dumps(completed_recent, indent=2)}
```

### Throughput (precomputed by Python)
rolling_7day_avg: {throughput_summary["rolling_7day_avg"]}
recommended_task_cap: {throughput_summary["recommended_task_cap"]}

### Context: task-patterns.json
{patterns_note}```json
{task_patterns_content if patterns_exists else "{}"}
```

### Context: goals.md
{goals_content}

### Context: preferences.md
{preferences_content}

### Context: today-feedback.md
{feedback_content}

---

## INSTRUCTIONS

{skill_content}

---

## OUTPUT FORMAT

You MUST wrap your outputs in these exact delimiters. Do not omit any section.

[BRIEF_START]
<the full daily-brief.md markdown content goes here>
[BRIEF_END]"""


GROCERY_LISTS = {"Groceries", "My list"}

CATEGORY_MAP = {
    "Career Search": "career",
    "AI Projects": "ai_projects",
    "Personal": "personal",
    "Today": None,  # infer from title
}

CAREER_KEYWORDS = {"job", "resume", "interview", "application", "linkedin", "recruiter", "offer", "salary"}
AI_KEYWORDS = {"build", "ship", "deploy", "code", "api", "tracker", "app", "feature", "bug", "claude"}


def _infer_category(list_name: str, title: str) -> str:
    cat = CATEGORY_MAP.get(list_name)
    if cat is not None:
        return cat
    tl = title.lower()
    if any(w in tl for w in CAREER_KEYWORDS):
        return "career"
    if any(w in tl for w in AI_KEYWORDS):
        return "ai_projects"
    return "personal"


def compute_task_patterns(
    open_tasks: dict,
    completed_recent: dict,
    existing: dict,
    today_dt: datetime,
) -> dict:
    """Compute task-patterns.json entirely in Python — no Claude call needed."""
    today_str = today_dt.strftime("%Y-%m-%d")
    cutoff_7 = (today_dt - timedelta(days=7)).strftime("%Y-%m-%d")
    cutoff_14 = (today_dt - timedelta(days=14)).strftime("%Y-%m-%d")
    cutoff_30 = (today_dt - timedelta(days=30)).strftime("%Y-%m-%d")
    cutoff_60 = (today_dt - timedelta(days=60)).strftime("%Y-%m-%d")

    snapshots = dict((existing or {}).get("task_snapshots", {}))

    # Update snapshots from open tasks (skip grocery lists)
    for list_name, tasks in open_tasks.items():
        if list_name in GROCERY_LISTS:
            continue
        for t in tasks:
            tid = t["id"]
            if tid in snapshots:
                snapshots[tid]["title"] = t["title"]
                snapshots[tid]["status"] = "needsAction"
                snapshots[tid]["due"] = t.get("due")
            else:
                snapshots[tid] = {
                    "title": t["title"],
                    "list": list_name,
                    "category": _infer_category(list_name, t["title"]),
                    "first_seen": today_str,
                    "status": "needsAction",
                    "due": t.get("due"),
                    "completed_date": None,
                }

    # Update snapshots from recently completed tasks (skip grocery lists)
    for list_name, tasks in completed_recent.items():
        if list_name in GROCERY_LISTS:
            continue
        for t in tasks:
            tid = t["id"]
            ts = t.get("completed")
            completed_date = ts[:10] if ts else today_str
            if tid in snapshots:
                if snapshots[tid].get("completed_date") is None:
                    snapshots[tid]["completed_date"] = completed_date
                snapshots[tid]["status"] = "completed"
            else:
                snapshots[tid] = {
                    "title": t["title"],
                    "list": list_name,
                    "category": _infer_category(list_name, t["title"]),
                    "first_seen": completed_date,
                    "status": "completed",
                    "due": t.get("due"),
                    "completed_date": completed_date,
                }

    # Prune entries completed more than 60 days ago
    snapshots = {
        k: v for k, v in snapshots.items()
        if not (v.get("completed_date") and v["completed_date"] < cutoff_60)
    }

    # Compute category_stats
    categories = ["career", "personal", "ai_projects"]
    category_stats = {}
    for cat in categories:
        cat_snaps = [v for v in snapshots.values() if v["category"] == cat]
        completed_7d = [v for v in cat_snaps if v.get("completed_date") and v["completed_date"] >= cutoff_7]
        open_cat = [v for v in cat_snaps if v["status"] == "needsAction"]
        completed_30d = [v for v in cat_snaps if v.get("completed_date") and v["completed_date"] >= cutoff_30]

        days_list = []
        quick_wins = 0
        for v in completed_30d:
            if v.get("first_seen") and v.get("completed_date"):
                try:
                    d1 = datetime.strptime(v["first_seen"], "%Y-%m-%d")
                    d2 = datetime.strptime(v["completed_date"], "%Y-%m-%d")
                    diff = (d2 - d1).days
                    days_list.append(diff)
                    if diff <= 1:
                        quick_wins += 1
                except ValueError:
                    pass

        stale_count = 0
        today_date = datetime.strptime(today_str, "%Y-%m-%d")
        for v in open_cat:
            if v.get("first_seen"):
                try:
                    age = (today_date - datetime.strptime(v["first_seen"], "%Y-%m-%d")).days
                    if age >= 7:
                        stale_count += 1
                except ValueError:
                    pass

        category_stats[cat] = {
            "completed_7d": len(completed_7d),
            "open_count": len(open_cat),
            "avg_days_to_complete": round(sum(days_list) / len(days_list), 1) if days_list else None,
            "quick_win_rate": round(quick_wins / len(completed_30d), 2) if completed_30d else 0.0,
            "stale_count": stale_count,
        }

    # Compute completion_time_of_day from last 14 days
    time_buckets = {"morning": 0, "afternoon": 0, "evening": 0}
    for list_name, tasks in completed_recent.items():
        for t in tasks:
            ts = t.get("completed")
            if not ts or ts[:10] < cutoff_14:
                continue
            try:
                hour = int(ts[11:13])
                if hour < 12:
                    time_buckets["morning"] += 1
                elif hour < 17:
                    time_buckets["afternoon"] += 1
                else:
                    time_buckets["evening"] += 1
            except (ValueError, IndexError):
                pass

    # Derive insights
    strongest = max(categories, key=lambda c: (category_stats[c]["quick_win_rate"], category_stats[c]["completed_7d"]))
    weakest = max(categories, key=lambda c: category_stats[c]["open_count"] / max(category_stats[c]["completed_7d"], 1))

    stale_tasks = []
    for tid, v in snapshots.items():
        if v["status"] == "needsAction" and v.get("first_seen"):
            try:
                age = (today_date - datetime.strptime(v["first_seen"], "%Y-%m-%d")).days
                if age >= 7:
                    stale_tasks.append({"id": tid, "title": v["title"], "category": v["category"], "age_days": age})
            except ValueError:
                pass
    stale_tasks.sort(key=lambda x: x["age_days"], reverse=True)

    last_template = (existing or {}).get("insights", {}).get("last_insight_template")

    return {
        "last_updated": today_str,
        "task_snapshots": snapshots,
        "category_stats": category_stats,
        "completion_time_of_day": time_buckets,
        "insights": {
            "strongest_category": strongest,
            "weakest_category": weakest,
            "stale_tasks": stale_tasks[:5],
            "last_insight_template": last_template,
        },
    }


# ── Output Parsing ────────────────────────────────────────────────────────────

def extract_block(text: str, start_tag: str, end_tag: str):
    """Extract content between delimiter tags. Returns None if not found."""
    pattern = re.compile(
        re.escape(start_tag) + r"\s*(.*?)\s*" + re.escape(end_tag),
        re.DOTALL,
    )
    match = pattern.search(text)
    return match.group(1).strip() if match else None


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    TOTAL = 10
    load_env()

    day_fmt = "%#d" if platform.system() == "Windows" else "%-d"
    today_dt = datetime.now(timezone.utc)
    today_str = today_dt.strftime(f"%A, %B {day_fmt}, %Y")
    subject = f"Daily Brief — {today_str}"

    # STEP 1: Load credentials ─────────────────────────────────────────────────
    t0 = time.monotonic()
    log(f"STEP 1/{TOTAL}: Loading Google credentials...")
    try:
        creds = load_google_credentials()
    except Exception as e:
        fail(subject, f"Failed to load Google credentials: {e}")
    log(f"  OK ({int((time.monotonic()-t0)*1000)}ms)")

    # STEP 2: Fetch Google Calendar ────────────────────────────────────────────
    t0 = time.monotonic()
    log(f"STEP 2/{TOTAL}: Fetching Google Calendar events...")
    try:
        from google.auth.exceptions import RefreshError
        calendar_events = fetch_calendar_events(creds, today_dt)
    except RefreshError as e:
        fail(
            subject,
            f"Google refresh token expired or revoked.\n\nError: {e}\n\n"
            "To fix: run sync-google-secret.py locally and update the GOOGLE_OAUTH_TOKEN secret.",
        )
    except Exception as e:
        fail(subject, f"Google Calendar fetch failed: {e}")
    log(f"  OK ({int((time.monotonic()-t0)*1000)}ms) — {len(calendar_events)} events")

    # STEP 3: Fetch Google Tasks ───────────────────────────────────────────────
    t0 = time.monotonic()
    log(f"STEP 3/{TOTAL}: Fetching Google Tasks...")
    try:
        open_tasks, completed_recent = fetch_tasks(creds, today_dt)
    except Exception as e:
        fail(subject, f"Google Tasks fetch failed: {e}")
    open_count = sum(len(v) for v in open_tasks.values())
    completed_count = sum(len(v) for v in completed_recent.values())
    log(f"  OK ({int((time.monotonic()-t0)*1000)}ms) — {open_count} open, {completed_count} completed (last 7d) across {len(open_tasks)} lists")

    # STEP 4: Read context files ───────────────────────────────────────────────
    t0 = time.monotonic()
    log(f"STEP 4/{TOTAL}: Reading context files...")
    patterns_exists = TASK_PATTERNS_PATH.exists()
    existing_throughput = json.loads(THROUGHPUT_PATH.read_text(encoding="utf-8")) if THROUGHPUT_PATH.exists() else {}
    log(
        f"  OK ({int((time.monotonic()-t0)*1000)}ms) — "
        f"throughput.json: {'found' if existing_throughput else 'missing (first run)'}, "
        f"task-patterns.json: {'found' if patterns_exists else 'not found (bootstrap mode)'}"
    )

    # STEP 4.5: Compute throughput ─────────────────────────────────────────────
    t0 = time.monotonic()
    log(f"STEP 4.5/{TOTAL}: Computing throughput...")
    throughput_summary = compute_throughput(completed_recent, existing_throughput, today_dt)
    THROUGHPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    THROUGHPUT_PATH.write_text(json.dumps(throughput_summary, indent=2), encoding="utf-8")
    log(
        f"  OK ({int((time.monotonic()-t0)*1000)}ms) — "
        f"avg: {throughput_summary['rolling_7day_avg']}/day, "
        f"cap: {throughput_summary['recommended_task_cap']}"
    )

    # STEP 5: Build prompt ─────────────────────────────────────────────────────
    t0 = time.monotonic()
    log(f"STEP 5/{TOTAL}: Building prompt...")
    try:
        prompt = build_prompt(today_str, calendar_events, open_tasks, completed_recent, throughput_summary)
    except Exception as e:
        fail(subject, f"Failed to build prompt: {e}")
    log(f"  OK ({int((time.monotonic()-t0)*1000)}ms) — {len(prompt):,} chars")

    # STEP 6: Call Claude API ──────────────────────────────────────────────────
    t0 = time.monotonic()
    log(f"STEP 6/{TOTAL}: Calling Claude API (claude-sonnet-4-6)...")
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=8192,
            system=(
                "You are generating a personalized daily brief. "
                "All external data has been pre-fetched and provided in the user message. "
                "Do not attempt to call any APIs, tools, or external services. "
                "Work only with the data given. "
                "CRITICAL: Do NOT show your reasoning, scratch work, or intermediate steps. "
                "Do NOT write 'STEP 1', 'STEP 2', or any similar narration. "
                "Output ONLY the brief wrapped in [BRIEF_START]...[BRIEF_END]. "
                "No preamble, no explanation, nothing before [BRIEF_START]."
            ),
            messages=[{"role": "user", "content": prompt}],
        )
        claude_output = response.content[0].text
        input_tokens = response.usage.input_tokens
        output_tokens = response.usage.output_tokens
    except Exception as e:
        fail(subject, f"Claude API call failed: {e}")
    log(f"  OK ({int((time.monotonic()-t0)*1000)}ms) — {input_tokens:,} input tokens, {output_tokens:,} output tokens")

    # STEP 7: Parse response ───────────────────────────────────────────────────
    t0 = time.monotonic()
    log(f"STEP 7/{TOTAL}: Parsing Claude response...")

    # Always save raw response so parse failures are diagnosable
    RAW_RESPONSE_PATH.write_text(claude_output, encoding="utf-8")
    log(f"  Raw response saved to {RAW_RESPONSE_PATH.name}")

    brief_content = extract_block(claude_output, "[BRIEF_START]", "[BRIEF_END]")
    if brief_content:
        log(f"  OK ({int((time.monotonic()-t0)*1000)}ms) — brief found")
    else:
        log("  WARNING: [BRIEF_START]..[BRIEF_END] not found — falling back to raw output")
        brief_content = claude_output
        preview = claude_output[:3000]
        try:
            send_email(
                f"[WARN] {subject} — parse issue",
                f"Brief block not found in Claude response.\n\nRaw output (first 3000 chars):\n\n{preview}",
            )
            log("  Parse warning email sent")
        except Exception as e:
            log(f"  Failed to send parse warning email: {e}")
        log(f"  OK ({int((time.monotonic()-t0)*1000)}ms) — used raw output")

    # STEP 8: Write brief ─────────────────────────────────────────────────────
    t0 = time.monotonic()
    log(f"STEP 8/{TOTAL}: Writing brief...")
    BRIEF_PATH.write_text(brief_content, encoding="utf-8")
    log(f"  OK ({int((time.monotonic()-t0)*1000)}ms)")

    # STEP 9: Send email ───────────────────────────────────────────────────────
    t0 = time.monotonic()
    log(f"STEP 9/{TOTAL}: Sending email...")

    body = brief_content
    github_repo = os.environ.get("GITHUB_REPO", "")
    if github_repo:
        from urllib.parse import quote
        issue_title = quote(f"[Feedback] Daily Brief — {today_str}")
        feedback_url = (
            f"https://github.com/{github_repo}/issues/new"
            f"?template=today-feedback.md&title={issue_title}&labels=today-feedback"
        )
        body += f"\n\n---\n[Leave feedback on today's brief]({feedback_url})"

    try:
        send_email(subject, body)
    except Exception as e:
        fail(subject, f"Failed to send email: {e}", send_error_email=False)
    log(f"  OK ({int((time.monotonic()-t0)*1000)}ms) — sent: {subject}")

    # STEP 9.5: Update task-patterns.json (Python, no Claude call needed) ──────
    t0 = time.monotonic()
    log(f"STEP 9.5/{TOTAL}: Updating task-patterns.json...")
    try:
        existing_patterns = json.loads(TASK_PATTERNS_PATH.read_text(encoding="utf-8")) if TASK_PATTERNS_PATH.exists() else {}
        patterns = compute_task_patterns(open_tasks, completed_recent, existing_patterns, today_dt)
        TASK_PATTERNS_PATH.write_text(json.dumps(patterns, indent=2), encoding="utf-8")
        stale_count = len(patterns["insights"]["stale_tasks"])
        snap_count = len(patterns["task_snapshots"])
        log(f"  OK ({int((time.monotonic()-t0)*1000)}ms) — {snap_count} snapshots, {stale_count} stale tasks, strongest: {patterns['insights']['strongest_category']}")
    except Exception as e:
        log(f"  WARNING: task-patterns update failed (non-fatal): {e}")


if __name__ == "__main__":
    main()

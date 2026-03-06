"""
morning-brief.py — runs /today skill via claude CLI and emails the result.
"""

import os
import platform
import smtplib
import subprocess
import sys
from datetime import datetime, timezone
from email.mime.text import MIMEText
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(os.environ.get("PROJECT_ROOT", Path.cwd()))
BRIEF_PATH = PROJECT_ROOT / "daily-brief.md"
LOG_PATH = PROJECT_ROOT / "automation" / "brief.log"
ENV_PATH = PROJECT_ROOT / "automation" / ".env"
CLAUDE_TIMEOUT = 600  # 10 minutes

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


def send_email(subject: str, body: str):
    app_password = os.environ["GMAIL_APP_PASSWORD"]
    send_from = os.environ["SEND_FROM"]
    send_to = os.environ["SEND_TO"]

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = send_from
    msg["To"] = send_to

    with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.login(send_from, app_password)
        smtp.sendmail(send_from, [send_to], msg.as_string())


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    load_env()
    day_fmt = "%#d" if platform.system() == "Windows" else "%-d"
    today = datetime.now().strftime(f"%A, %B {day_fmt}, %Y")
    subject = f"Daily Brief — {today}"

    # Record mtime of daily-brief.md before running claude (to detect staleness)
    brief_mtime_before = BRIEF_PATH.stat().st_mtime if BRIEF_PATH.exists() else None

    # Run `claude -p "/today"` non-interactively
    log("Running claude -p \"/today\" ...")
    if platform.system() == "Windows":
        cmd = ["powershell.exe", "-NoProfile", "-Command", "claude -p '/today'"]
    else:
        cmd = ["claude", "-p", "/today", "--dangerously-skip-permissions"]
    try:
        result = subprocess.run(
            cmd,
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            timeout=CLAUDE_TIMEOUT,
        )
    except subprocess.TimeoutExpired:
        err = f"claude subprocess timed out after {CLAUDE_TIMEOUT}s"
        log(f"ERROR: {err}")
        try:
            send_email(f"[ERROR] {subject}", f"Morning brief failed: {err}")
        except Exception as email_err:
            log(f"ERROR: also failed to send error email: {email_err}")
        sys.exit(1)
    except FileNotFoundError:
        err = f"claude command not found — check PATH ({cmd[0]})"
        log(f"ERROR: {err}")
        try:
            send_email(f"[ERROR] {subject}", f"Morning brief failed: {err}")
        except Exception as email_err:
            log(f"ERROR: also failed to send error email: {email_err}")
        sys.exit(1)

    if result.returncode != 0:
        err = f"claude exited with code {result.returncode}:\nSTDERR: {result.stderr[:1000]}\nSTDOUT: {result.stdout[:1000]}"
        log(f"ERROR: {err}")
        try:
            send_email(f"[ERROR] {subject}", f"Morning brief failed:\n\n{err}")
        except Exception as email_err:
            log(f"ERROR: also failed to send error email: {email_err}")
        sys.exit(1)

    log("claude finished successfully.")

    # Read daily-brief.md
    if not BRIEF_PATH.exists():
        err = "daily-brief.md was not created by the skill."
        log(f"WARNING: {err}")
        body = f"[Warning: {err}]\n\nClaude output:\n\n{result.stdout[:4000]}"
    else:
        brief_mtime_after = BRIEF_PATH.stat().st_mtime
        if brief_mtime_before is not None and brief_mtime_after <= brief_mtime_before:
            log("WARNING: daily-brief.md was not updated (stale content) — sending anyway.")
            body = "[Warning: daily-brief.md was not updated this run — content may be from a previous day.]\n\n"
            body += BRIEF_PATH.read_text(encoding="utf-8")
        else:
            body = BRIEF_PATH.read_text(encoding="utf-8")

    # Send email
    try:
        send_email(subject, body)
        log(f"Email sent: {subject}")
    except Exception as e:
        log(f"ERROR: Failed to send email: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

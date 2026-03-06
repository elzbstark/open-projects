"""
Refresh the Google OAuth access token using the stored refresh token.
Runs before the morning brief so workspace-mcp gets a fresh token.
"""
import json
import datetime
import pathlib
import urllib.request
import urllib.parse

CREDS_PATH = pathlib.Path.home() / ".google_workspace_mcp/credentials/your-email@gmail.com.json"

creds = json.loads(CREDS_PATH.read_text())

data = urllib.parse.urlencode({
    "client_id": creds["client_id"],
    "client_secret": creds["client_secret"],
    "refresh_token": creds["refresh_token"],
    "grant_type": "refresh_token",
}).encode()

req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
with urllib.request.urlopen(req) as resp:
    token_data = json.loads(resp.read())

if "access_token" not in token_data:
    raise RuntimeError(f"Token refresh failed: {token_data}")

creds["token"] = token_data["access_token"]
expiry = datetime.datetime.utcnow() + datetime.timedelta(seconds=token_data["expires_in"])
creds["expiry"] = expiry.isoformat()
CREDS_PATH.write_text(json.dumps(creds, indent=2))
print(f"Google token refreshed. Expires: {creds['expiry']}")

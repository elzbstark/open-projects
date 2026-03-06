import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("spotify")

SCOPES = "playlist-read-private playlist-read-collaborative user-library-read"


def get_spotify() -> spotipy.Spotify:
    return spotipy.Spotify(
        auth_manager=SpotifyOAuth(
            client_id=os.environ["SPOTIFY_CLIENT_ID"],
            client_secret=os.environ["SPOTIFY_CLIENT_SECRET"],
            redirect_uri=os.environ["SPOTIFY_REDIRECT_URI"],
            scope=SCOPES,
            cache_path=os.environ.get("SPOTIFY_CACHE_PATH", ".cache"),
            open_browser=False,
        )
    )


@mcp.tool()
def list_playlists() -> list[dict]:
    """Return all playlists owned or followed by the authenticated user."""
    sp = get_spotify()
    results = []
    offset = 0
    while True:
        batch = sp.current_user_playlists(limit=50, offset=offset)
        for item in batch["items"]:
            results.append(
                {
                    "id": item["id"],
                    "name": item["name"],
                    "track_count": (item.get("tracks") or {}).get("total", 0),
                    "public": item["public"],
                    "owner": item["owner"]["display_name"],
                }
            )
        if batch["next"] is None:
            break
        offset += 50
    return results


@mcp.tool()
def get_playlist_tracks(playlist_id: str) -> list[dict]:
    """Return all tracks in a playlist.

    Args:
        playlist_id: Spotify playlist ID (e.g. '37i9dQZF1DX...'). You can also
                     pass a playlist name — the tool will resolve it automatically.
    """
    sp = get_spotify()

    # If the caller passed a name instead of an ID, resolve it
    if not playlist_id.startswith("spotify:") and len(playlist_id) != 22:
        name_lower = playlist_id.lower()
        offset = 0
        found_id = None
        while True:
            batch = sp.current_user_playlists(limit=50, offset=offset)
            for item in batch["items"]:
                if item["name"].lower() == name_lower:
                    found_id = item["id"]
                    break
            if found_id or batch["next"] is None:
                break
            offset += 50
        if not found_id:
            raise ValueError(f"No playlist found with name '{playlist_id}'")
        playlist_id = found_id

    tracks = []
    offset = 0
    while True:
        batch = sp.playlist_items(
            playlist_id,
            limit=100,
            offset=offset,
            fields="next,items(added_at,track(name,album(name),artists(name),duration_ms))",
        )
        for item in batch["items"]:
            t = item.get("track")
            if not t:
                continue
            duration_sec = t["duration_ms"] // 1000
            tracks.append(
                {
                    "title": t["name"],
                    "artist": ", ".join(a["name"] for a in t["artists"]),
                    "album": t["album"]["name"],
                    "duration": f"{duration_sec // 60}:{duration_sec % 60:02d}",
                    "added_at": item.get("added_at", ""),
                }
            )
        if batch["next"] is None:
            break
        offset += 100
    return tracks


@mcp.tool()
def get_saved_episodes(limit: int = 50) -> list[dict]:
    """Return the user's saved podcast episodes ('Your Episodes')."""
    sp = get_spotify()
    results = []
    offset = 0
    while True:
        batch = sp.current_user_saved_episodes(limit=50, offset=offset)
        for item in batch["items"]:
            ep = item["episode"]
            results.append({
                "title": ep["name"],
                "show": ep["show"]["name"],
                "description": ep["description"][:200],
                "duration": f"{ep['duration_ms'] // 60000} min",
                "added_at": item["added_at"],
            })
            if len(results) >= limit:
                break
        if batch["next"] is None or len(results) >= limit:
            break
        offset += 50
    return results


if __name__ == "__main__":
    mcp.run()

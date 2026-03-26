from fastmcp import FastMCP
import logging
import os
import httpx

logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

mcp = FastMCP(name="SpotifyServer")


def _get_token() -> str:
    logger.info("Getting Token")
    return os.environ.get("SPOTIFY_TOKEN")


def _check_auth(response) -> None:
    logger.info("SPOTIFY AUTH EXPIRED")
    if response.status_code == 401:
        raise ValueError("SPOTIFY_AUTH_EXPIRED")


def _get_player_status(token: str) -> dict:
    logger.info("Getting player status")
    response = httpx.get(
        "https://api.spotify.com/v1/me/player",
        headers={"Authorization": f"Bearer {token}"},
    )
    _check_auth(response)
    if response.status_code == 204:
        return None
    return response.json()


@mcp.tool()
def get_current_user_profile() -> dict:
    """Returns the current Spotify user's profile."""

    token = _get_token()
    logger.info("Tool called: get_current_user_profile")

    response = httpx.get(
        "https://api.spotify.com/v1/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    _check_auth(response)

    response.raise_for_status()
    data = response.json()

    logger.info(f"Tool data: {data}")

    return {
        "display_name": data.get("display_name"),
        "email": data.get("email"),
        "id": data.get("id"),
        "product": data.get("product"),
        "followers": data.get("followers", {}).get("total"),
    }


@mcp.tool()
def get_current_user_player_status() -> dict:
    """Returns the current Spotify user's player status including what's playing, device info, and playback state."""

    logger.info("Tool called: get_current_user_player_status")

    token = _get_token()
    status = _get_player_status(token)

    if not status:
        return {"is_playing": False, "message": "No active playback session found"}

    item = status.get("item", {})
    album = item.get("album", {})
    artists = item.get("artists", [])

    data = {
        "is_playing": status.get("is_playing"),
        "track_name": item.get("name"),
        "artists": [a.get("name") for a in artists],
        "album_name": album.get("name"),
        "device_name": status.get("device", {}).get("name"),
        "shuffle": status.get("shuffle_state"),
        "repeat": status.get("repeat_state"),
    }
    logger.info(f"Tool data: {data}")

    return data


@mcp.tool()
def search_and_play(query: str) -> dict:
    """Searches for a track on Spotify and plays the first result."""
    token = _get_token()

    search_response = httpx.get(
        "https://api.spotify.com/v1/search",
        headers={"Authorization": f"Bearer {token}"},
        params={"q": query, "type": "track", "limit": 1},
    )
    _check_auth(search_response)
    search_response.raise_for_status()

    items = search_response.json().get("tracks", {}).get("items", [])
    if not items:
        return {"message": f"No tracks found for '{query}'"}

    track = items[0]
    track_uri = track.get("uri")
    track_name = track.get("name")
    artists = [a.get("name") for a in track.get("artists", [])]

    play_response = httpx.put(
        "https://api.spotify.com/v1/me/player/play",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={"uris": [track_uri]},
    )
    _check_auth(play_response)
    play_response.raise_for_status()

    return {
        "message": f"Now playing: {track_name} by {', '.join(artists)}",
        "track_uri": track_uri,
    }


@mcp.tool()
def resume_playback() -> dict:
    """Resumes the current Spotify playback if it is paused."""

    logger.info("Tool called: resume_playback")
    token = _get_token()
    status = _get_player_status(token)

    if not status:
        return {"message": "No active playback session found"}
    if status.get("is_playing"):
        return {"message": "Player is already playing"}

    response = httpx.put(
        "https://api.spotify.com/v1/me/player/play",
        headers={"Authorization": f"Bearer {token}"},
    )
    _check_auth(response)
    return {"message": "Playback resumed"}


@mcp.tool()
def pause_playback() -> dict:
    """Pauses the current Spotify playback if it is playing."""
    logger.info("Tool called: pause_playback")

    token = _get_token()
    status = _get_player_status(token)

    if not status:
        return {"message": "No active playback session found"}
    if not status.get("is_playing"):
        return {"message": "Player is already paused"}

    response = httpx.put(
        "https://api.spotify.com/v1/me/player/pause",
        headers={"Authorization": f"Bearer {token}"},
    )
    _check_auth(response)
    return {"message": "Playback paused"}


@mcp.tool()
def skip_to_next() -> dict:
    """Skips to the next track in the current Spotify playback."""
    logger.info("Tool called: skip_to_next")

    token = _get_token()

    response = httpx.post(
        "https://api.spotify.com/v1/me/player/next",
        headers={"Authorization": f"Bearer {token}"},
    )
    _check_auth(response)
    return {"message": "Skipped to next track"}


@mcp.tool()
def skip_to_previous() -> dict:
    """Skips to the previous track in the current Spotify playback."""
    logger.info("Tool called: skip_to_previous")

    token = _get_token()

    response = httpx.post(
        "https://api.spotify.com/v1/me/player/previous",
        headers={"Authorization": f"Bearer {token}"},
    )
    _check_auth(response)
    return {"message": "Skipped to previous track"}


@mcp.tool()
def set_volume(volume_percent: int) -> dict:
    """Sets the playback volume. volume_percent must be between 0 and 100."""
    logger.info("Tool called: set_volume")

    token = _get_token()

    if not 0 <= volume_percent <= 100:
        return {"message": "Volume must be between 0 and 100"}

    response = httpx.put(
        "https://api.spotify.com/v1/me/player/volume",
        headers={"Authorization": f"Bearer {token}"},
        params={"volume_percent": volume_percent},
    )
    _check_auth(response)
    return {"message": f"Volume set to {volume_percent}%"}

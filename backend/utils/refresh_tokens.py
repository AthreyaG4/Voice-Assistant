from config import settings
import httpx
import base64
from fastapi import HTTPException


async def refresh_spotify_token(refresh_token: str) -> dict:
    print("*" * 60)
    print("REFRESHING TOKENS")
    print("*" * 60)
    credentials = f"{settings.SPOTIFY_CLIENT_ID}:{settings.SPOTIFY_CLIENT_SECRET}"
    encoded = base64.b64encode(credentials.encode()).decode()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://accounts.spotify.com/api/token",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {encoded}",
            },
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code, detail="Failed to refresh Spotify token"
        )

    body = response.json()

    return {
        "access_token": body["access_token"],
        "refresh_token": body.get("refresh_token", refresh_token),
        "expires_in": body["expires_in"],
    }

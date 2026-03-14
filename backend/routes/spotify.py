from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from config import settings
import urllib.parse
import httpx
import base64
from models import Auth

router = APIRouter(prefix="/api/spotify", tags=["spotify"])

SCOPE = "user-read-private user-read-email"
SPOTIFY_REDIRECT_URI = "http://127.0.0.1:8000/api/spotify/callback"


@router.get("/status")
async def spotify_status():
    auth = await Auth.find_one()
    return {"connected": auth is not None}


@router.get("/login")
async def spotify_login():
    params = {
        "client_id": settings.SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": SPOTIFY_REDIRECT_URI,
        "scope": SCOPE,
    }
    url = "https://accounts.spotify.com/authorize?" + urllib.parse.urlencode(params)
    return RedirectResponse(url)


@router.get("/callback")
async def spotify_callback(code: str):
    credentials = base64.b64encode(
        f"{settings.SPOTIFY_CLIENT_ID}:{settings.SPOTIFY_CLIENT_SECRET}".encode()
    ).decode()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://accounts.spotify.com/api/token",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {credentials}",
            },
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": SPOTIFY_REDIRECT_URI,
            },
        )
        response.raise_for_status()
        tokens = response.json()

    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]
    expires_in = tokens["expires_in"]

    auth = Auth(
        access_token=access_token, refresh_token=refresh_token, expires_in=expires_in
    )
    await auth.insert()

    return RedirectResponse("http://127.0.0.1:5173/")

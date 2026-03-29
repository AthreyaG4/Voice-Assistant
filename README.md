# Voice Assistant for Spotify

A full-stack voice assistant web app with Spotify integration. Speak commands in the browser and control Spotify playback, playlists, and more by connecting your account.

## What it does

- Authenticates users via Spotify and stores refresh tokens
- Accepts voice commands in the browser using Web Speech APIs
- Sends voice input to backend agent for intent handling
- Controls Spotify (play/pause/next/previous, search tracks, manage queue, playback state, etc.)
- Returns conversational responses and action confirmations
- Health checks and graceful API status confirmation

## Tech stack

- Backend: FastAPI + Uvicorn
- MCP server orchestration: FastMCP (in `mcp-servers/`)
- Voice agent: Google SDK (Google ADK / assistant dev kit) in `backend/agent`
- Spotify integration: Spotify Web API + OAuth flow in `backend/routes/spotify.py`
- Database: MongoDB (containerized via Docker Compose)
- Frontend: React + Vite
- API client: Axios (or fetch) wrappers in `frontend/src/api`
- Router: React Router (if present)
- Speech-to-text: OpenAI Whisper (audio transcription pipeline)

## Repo layout

- `backend/` - FastAPI app and business logic
- `frontend/` - React app
- `mcp-servers/` - model context protocol server support
- `compose.yml` - Docker Compose for local dev
- `.env.example` - env variable template

## 🛠️ Local development (Docker Compose)

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Edit `.env` with your values, for example:

```dotenv
MONGO_INITDB_ROOT_USERNAME=your_user_name
MONGO_INITDB_ROOT_PASSWORD=your_secret_password
```

3. Start all services:

```bash
docker compose up --build
```

4. Access the app in browser:

- Frontend: `http://localhost:5173` (or port from `vite.config.js`)
- Backend API: `http://localhost:8000`

5. Stop services:

```bash
docker compose down
```

## Environment variables

- `MONGO_INITDB_ROOT_USERNAME` (Mongo root username)
- `MONGO_INITDB_ROOT_PASSWORD` (Mongo root password)

Add additional vars used by your FastAPI app (e.g., `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, etc.) in `.env` as needed.

## Testing and QA

- Run backend tests (if tests exist) in `backend/` with `pytest`
- Run frontend checks with `npm run lint` / `npm run test` (if available)

## Notes

- Ensure your Spotify app is set up and redirect URI is configured.

---

Enjoy building a voice-first Spotify experience!
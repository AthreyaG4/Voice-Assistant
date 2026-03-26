from fastapi import FastAPI
from contextlib import asynccontextmanager
from routes.health import router as health_router
from routes.spotify import router as spotify_router
from routes.chat import router as chat_router
from fastapi.middleware.cors import CORSMiddleware
from db import init_db
from models import Auth
from agent.agent import initialize_agent, session_service, APP_NAME, USER_ID, SESSION_ID


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    await session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
    )
    print(
        f"Session created: App='{APP_NAME}', User='{USER_ID}', Session='{SESSION_ID}'"
    )

    auth = await Auth.find_one()
    if auth and auth.access_token:
        initialize_agent(auth.access_token)
        print("Agent initialized from existing token")
    else:
        print("No token found, waiting for Spotify login")

    yield


app = FastAPI(lifespan=lifespan)

origins = ["http://localhost", "http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(health_router)
app.include_router(spotify_router)
app.include_router(chat_router)
